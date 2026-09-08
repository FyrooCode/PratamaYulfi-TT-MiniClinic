const db = require('../config/db');
const { generateRegistrationNumber } = require('../utils/generator');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');

/**
 * @desc    Get doctors dropdown list with active_patients_today metric
 * @route   GET /api/registrations/doctors
 * @access  Protected (admin, receptionist)
 */
const getDoctorsDropdown = async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        u.id, 
        u.name, 
        u.email,
        u.role,
        COALESCE(active_reg.active_count, 0)::integer AS active_patients_today
      FROM users u
      LEFT JOIN (
        SELECT doctor_id, COUNT(*) AS active_count
        FROM registrations
        WHERE visit_date = CURRENT_DATE
          AND status IN ('Menunggu', 'Check In', 'Pemeriksaan')
        GROUP BY doctor_id
      ) active_reg ON u.id = active_reg.doctor_id
      WHERE u.role = 'doctor'
      ORDER BY u.name ASC;
    `;

    const result = await db.query(sql);
    return sendSuccess(res, 'Doctors list retrieved successfully', result.rows, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registrations with pagination, filtering, and joins
 * @route   GET /api/registrations
 * @access  Protected (admin, receptionist, doctor)
 */
const getAllRegistrations = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      visit_date = '',
      clinic_department = '',
      doctor_id = '',
    } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const offset = (page - 1) * limit;

    const whereClauses = [];
    const queryParams = [];

    // 1. Search Filter (Patient Name, NIK, No. RM, or Registration Number)
    const cleanSearch = typeof search === 'string' ? search.trim() : '';
    if (cleanSearch) {
      queryParams.push(`%${cleanSearch}%`);
      const searchIndex = queryParams.length;
      whereClauses.push(`(
        p.name ILIKE $${searchIndex} 
        OR p.nik ILIKE $${searchIndex} 
        OR p.medical_record_number ILIKE $${searchIndex} 
        OR r.registration_number ILIKE $${searchIndex}
      )`);
    }

    // 2. Status Filter
    if (status && typeof status === 'string' && status.trim()) {
      queryParams.push(status.trim());
      whereClauses.push(`r.status = $${queryParams.length}`);
    }

    // 3. Visit Date Filter (YYYY-MM-DD)
    if (visit_date && typeof visit_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(visit_date.trim())) {
      queryParams.push(visit_date.trim());
      whereClauses.push(`r.visit_date = $${queryParams.length}`);
    }

    // 4. Clinic Department Filter
    if (clinic_department && typeof clinic_department === 'string' && clinic_department.trim()) {
      queryParams.push(`%${clinic_department.trim()}%`);
      whereClauses.push(`r.clinic_department ILIKE $${queryParams.length}`);
    }

    // 5. Doctor ID Filter
    const doctorIdInt = parseInt(doctor_id, 10);
    if (!isNaN(doctorIdInt) && doctorIdInt > 0) {
      queryParams.push(doctorIdInt);
      whereClauses.push(`r.doctor_id = $${queryParams.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count Total
    const countSql = `
      SELECT COUNT(*) AS total
      FROM registrations r
      JOIN patients p ON r.patient_id = p.id
      LEFT JOIN users u ON r.doctor_id = u.id
      ${whereSql}
    `;
    const countResult = await db.query(countSql, queryParams);
    const totalData = parseInt(countResult.rows[0].total, 10);
    const totalPages = totalData === 0 ? 1 : Math.ceil(totalData / limit);

    // Fetch Paginated Records
    const dataParams = [...queryParams];
    const limitIndex = dataParams.length + 1;
    const offsetIndex = dataParams.length + 2;
    dataParams.push(limit, offset);

    const dataSql = `
      SELECT 
        r.id,
        r.registration_number,
        r.patient_id,
        r.doctor_id,
        r.clinic_department,
        r.visit_date,
        r.payment_type,
        r.initial_complaint,
        r.status,
        r.created_at,
        p.name AS patient_name,
        p.medical_record_number,
        p.nik AS patient_nik,
        p.gender AS patient_gender,
        p.dob AS patient_dob,
        p.phone AS patient_phone,
        u.name AS doctor_name,
        u.email AS doctor_email
      FROM registrations r
      JOIN patients p ON r.patient_id = p.id
      LEFT JOIN users u ON r.doctor_id = u.id
      ${whereSql}
      ORDER BY r.id DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const dataResult = await db.query(dataSql, dataParams);

    const formattedData = dataResult.rows.map((row) => ({
      id: row.id,
      registration_number: row.registration_number,
      clinic_department: row.clinic_department,
      visit_date: row.visit_date,
      payment_type: row.payment_type,
      initial_complaint: row.initial_complaint,
      status: row.status,
      created_at: row.created_at,
      patient: {
        id: row.patient_id,
        name: row.patient_name,
        medical_record_number: row.medical_record_number,
        nik: row.patient_nik,
        gender: row.patient_gender,
        dob: row.patient_dob,
        phone: row.patient_phone,
      },
      doctor: row.doctor_id
        ? {
            id: row.doctor_id,
            name: row.doctor_name,
            email: row.doctor_email,
          }
        : null,
    }));

    return sendPaginated(
      res,
      'Registrations retrieved successfully',
      formattedData,
      {
        totalData,
        totalPages,
        currentPage: page,
        limit,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single registration details by ID
 * @route   GET /api/registrations/:id
 * @access  Protected (admin, receptionist, doctor)
 */
const getRegistrationById = async (req, res, next) => {
  try {
    const registrationId = parseInt(req.params.id, 10);
    if (isNaN(registrationId)) {
      return sendError(res, 'Invalid registration ID format', { id: 'Must be an integer' }, 400);
    }

    const sql = `
      SELECT 
        r.id,
        r.registration_number,
        r.patient_id,
        r.doctor_id,
        r.clinic_department,
        r.visit_date,
        r.payment_type,
        r.initial_complaint,
        r.status,
        r.created_at,
        p.name AS patient_name,
        p.medical_record_number,
        p.nik AS patient_nik,
        p.gender AS patient_gender,
        p.dob AS patient_dob,
        p.phone AS patient_phone,
        p.address AS patient_address,
        u.name AS doctor_name,
        u.email AS doctor_email
      FROM registrations r
      JOIN patients p ON r.patient_id = p.id
      LEFT JOIN users u ON r.doctor_id = u.id
      WHERE r.id = $1
    `;

    const result = await db.query(sql, [registrationId]);
    if (result.rows.length === 0) {
      return sendError(res, 'Registration not found', {}, 404);
    }

    const row = result.rows[0];
    const data = {
      id: row.id,
      registration_number: row.registration_number,
      clinic_department: row.clinic_department,
      visit_date: row.visit_date,
      payment_type: row.payment_type,
      initial_complaint: row.initial_complaint,
      status: row.status,
      created_at: row.created_at,
      patient: {
        id: row.patient_id,
        name: row.patient_name,
        medical_record_number: row.medical_record_number,
        nik: row.patient_nik,
        gender: row.patient_gender,
        dob: row.patient_dob,
        phone: row.patient_phone,
        address: row.patient_address,
      },
      doctor: row.doctor_id
        ? {
            id: row.doctor_id,
            name: row.doctor_name,
            email: row.doctor_email,
          }
        : null,
    };

    return sendSuccess(res, 'Registration retrieved successfully', data, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new patient visit registration (Status strictly locked to 'Menunggu')
 * @route   POST /api/registrations
 * @access  Protected (admin, receptionist)
 */
const createRegistration = async (req, res, next) => {
  try {
    const {
      patient_id,
      doctor_id,
      clinic_department,
      payment_type,
      visit_date,
      initial_complaint,
    } = req.body;

    const errors = {};

    // 1. Validation: patient_id
    const parsedPatientId = parseInt(patient_id, 10);
    if (!patient_id || isNaN(parsedPatientId)) {
      errors.patient_id = 'patient_id is required and must be an integer';
    }

    // 2. Validation: doctor_id
    const parsedDoctorId = parseInt(doctor_id, 10);
    if (!doctor_id || isNaN(parsedDoctorId)) {
      errors.doctor_id = 'doctor_id is required and must be an integer';
    }

    // 3. Validation: clinic_department
    if (!clinic_department || typeof clinic_department !== 'string' || clinic_department.trim().length === 0) {
      errors.clinic_department = 'clinic_department is required';
    }

    // 4. Validation: payment_type
    if (!payment_type || typeof payment_type !== 'string' || payment_type.trim().length === 0) {
      errors.payment_type = 'payment_type is required';
    }

    // 5. Validation: visit_date
    let cleanVisitDate = new Date().toISOString().split('T')[0];
    if (visit_date !== undefined && visit_date !== null && visit_date !== '') {
      if (typeof visit_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(visit_date.trim()) || isNaN(Date.parse(visit_date.trim()))) {
        errors.visit_date = 'visit_date must be in valid YYYY-MM-DD format';
      } else {
        cleanVisitDate = visit_date.trim();
      }
    }

    if (Object.keys(errors).length > 0) {
      return sendError(res, 'Validation error', errors, 400);
    }

    // 6. Verify Patient Exists
    const patientCheck = await db.query('SELECT id, name, medical_record_number FROM patients WHERE id = $1', [parsedPatientId]);
    if (patientCheck.rows.length === 0) {
      return sendError(res, 'Patient not found', { patient_id: 'Patient with this ID does not exist' }, 404);
    }

    // 7. Verify Doctor Exists & has role 'doctor'
    const doctorCheck = await db.query('SELECT id, name, role FROM users WHERE id = $1', [parsedDoctorId]);
    if (doctorCheck.rows.length === 0 || doctorCheck.rows[0].role !== 'doctor') {
      return sendError(res, 'Invalid doctor: User must exist and have role doctor', { doctor_id: 'User is not a valid doctor' }, 400);
    }

    // 8. Hardcoded Initial Status
    const initialStatus = 'Menunggu';

    // 9. Generate Registration Number & Insert with Retry Safeguard
    let newRegistration = null;
    let attempts = 0;

    while (attempts < 3) {
      try {
        const registrationNumber = await generateRegistrationNumber();
        const insertSql = `
          INSERT INTO registrations (
            registration_number,
            patient_id,
            doctor_id,
            clinic_department,
            visit_date,
            payment_type,
            initial_complaint,
            status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;

        const insertResult = await db.query(insertSql, [
          registrationNumber,
          parsedPatientId,
          parsedDoctorId,
          clinic_department.trim(),
          cleanVisitDate,
          payment_type.trim(),
          initial_complaint && typeof initial_complaint === 'string' ? initial_complaint.trim() : null,
          initialStatus,
        ]);

        newRegistration = insertResult.rows[0];
        break;
      } catch (err) {
        if (err.code === '23505' && err.detail?.includes('registration_number')) {
          attempts++;
          continue;
        }
        throw err;
      }
    }

    if (!newRegistration) {
      return sendError(res, 'Failed to generate a unique registration number. Please try again.', {}, 500);
    }

    // Return with structured patient and doctor info
    const responseData = {
      ...newRegistration,
      patient: patientCheck.rows[0],
      doctor: {
        id: doctorCheck.rows[0].id,
        name: doctorCheck.rows[0].name,
      },
    };

    return sendSuccess(res, 'Patient visit registration created successfully', responseData, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update visit registration details (registration_number and patient_id are immutable)
 * @route   PUT /api/registrations/:id
 * @access  Protected (admin, receptionist)
 */
const updateRegistration = async (req, res, next) => {
  try {
    const registrationId = parseInt(req.params.id, 10);
    if (isNaN(registrationId)) {
      return sendError(res, 'Invalid registration ID format', { id: 'Must be an integer' }, 400);
    }

    // 1. Verify Registration Exists
    const existingResult = await db.query('SELECT * FROM registrations WHERE id = $1', [registrationId]);
    if (existingResult.rows.length === 0) {
      return sendError(res, 'Registration not found', {}, 404);
    }

    const currentReg = existingResult.rows[0];
    const { doctor_id, clinic_department, payment_type, visit_date, initial_complaint } = req.body;
    const errors = {};

    // 2. Validate Doctor if provided
    let cleanDoctorId = currentReg.doctor_id;
    if (doctor_id !== undefined) {
      const parsedDocId = parseInt(doctor_id, 10);
      if (isNaN(parsedDocId)) {
        errors.doctor_id = 'doctor_id must be an integer';
      } else {
        const docCheck = await db.query('SELECT id, role FROM users WHERE id = $1', [parsedDocId]);
        if (docCheck.rows.length === 0 || docCheck.rows[0].role !== 'doctor') {
          errors.doctor_id = 'User is not a valid doctor';
        } else {
          cleanDoctorId = parsedDocId;
        }
      }
    }

    // 3. Validate Clinic Department if provided
    let cleanDept = currentReg.clinic_department;
    if (clinic_department !== undefined) {
      if (typeof clinic_department !== 'string' || clinic_department.trim().length === 0) {
        errors.clinic_department = 'clinic_department cannot be empty';
      } else {
        cleanDept = clinic_department.trim();
      }
    }

    // 4. Validate Payment Type if provided
    let cleanPayment = currentReg.payment_type;
    if (payment_type !== undefined) {
      if (typeof payment_type !== 'string' || payment_type.trim().length === 0) {
        errors.payment_type = 'payment_type cannot be empty';
      } else {
        cleanPayment = payment_type.trim();
      }
    }

    // 5. Validate Visit Date if provided
    let cleanVisitDate = currentReg.visit_date;
    if (visit_date !== undefined) {
      if (typeof visit_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(visit_date.trim()) || isNaN(Date.parse(visit_date.trim()))) {
        errors.visit_date = 'visit_date must be in valid YYYY-MM-DD format';
      } else {
        cleanVisitDate = visit_date.trim();
      }
    }

    if (Object.keys(errors).length > 0) {
      return sendError(res, 'Validation error', errors, 400);
    }

    const cleanComplaint = initial_complaint !== undefined
      ? (typeof initial_complaint === 'string' ? initial_complaint.trim() : null)
      : currentReg.initial_complaint;

    // 6. Update database (registration_number and patient_id remain IMMUTABLE)
    const updateSql = `
      UPDATE registrations
      SET doctor_id = $1,
          clinic_department = $2,
          payment_type = $3,
          visit_date = $4,
          initial_complaint = $5
      WHERE id = $6
      RETURNING *
    `;

    const updateResult = await db.query(updateSql, [
      cleanDoctorId,
      cleanDept,
      cleanPayment,
      cleanVisitDate,
      cleanComplaint,
      registrationId,
    ]);

    return sendSuccess(res, 'Registration updated successfully', updateResult.rows[0], 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete visit registration (Relational integrity check: blocked if medical records exist)
 * @route   DELETE /api/registrations/:id
 * @access  Protected (admin, receptionist)
 */
const deleteRegistration = async (req, res, next) => {
  try {
    const registrationId = parseInt(req.params.id, 10);
    if (isNaN(registrationId)) {
      return sendError(res, 'Invalid registration ID format', { id: 'Must be an integer' }, 400);
    }

    // 1. Verify Registration Exists
    const checkResult = await db.query('SELECT id, registration_number FROM registrations WHERE id = $1', [registrationId]);
    if (checkResult.rows.length === 0) {
      return sendError(res, 'Registration not found', {}, 404);
    }

    // 2. Check Relational Integrity: medical_records
    const medCheck = await db.query(
      'SELECT COUNT(*) AS total FROM medical_records WHERE registration_id = $1',
      [registrationId]
    );

    const medCount = parseInt(medCheck.rows[0].total, 10);
    if (medCount > 0) {
      return sendError(
        res,
        'Cannot delete registration: Medical examination record already exists',
        { medicalRecordsCount: medCount },
        400
      );
    }

    // 3. Delete Registration
    await db.query('DELETE FROM registrations WHERE id = $1', [registrationId]);

    return sendSuccess(res, 'Registration deleted successfully', { id: registrationId }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctorsDropdown,
  getAllRegistrations,
  getRegistrationById,
  createRegistration,
  updateRegistration,
  deleteRegistration,
};
