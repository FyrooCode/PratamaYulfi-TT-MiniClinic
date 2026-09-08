const db = require('../config/db');
const { generateMedicalRecordNumber } = require('../utils/generator');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');

/**
 * @desc    Get all patients with pagination and multi-field search
 * @route   GET /api/patients
 * @access  Protected (admin, receptionist, doctor)
 */
const getAllPatients = async (req, res, next) => {
  try {
    let { page = 1, limit = 10, search = '' } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const offset = (page - 1) * limit;

    let whereClause = '';
    const queryParams = [];

    const cleanSearch = typeof search === 'string' ? search.trim() : '';
    if (cleanSearch) {
      whereClause = `
        WHERE name ILIKE $1 
           OR nik ILIKE $1 
           OR medical_record_number ILIKE $1
      `;
      queryParams.push(`%${cleanSearch}%`);
    }

    // 1. Query total count matching the search criteria
    const countSql = `SELECT COUNT(*) AS total FROM patients ${whereClause}`;
    const countResult = await db.query(countSql, queryParams);
    const totalData = parseInt(countResult.rows[0].total, 10);
    const totalPages = totalData === 0 ? 1 : Math.ceil(totalData / limit);

    // 2. Query paginated patient records
    const dataParams = [...queryParams];
    const limitIndex = dataParams.length + 1;
    const offsetIndex = dataParams.length + 2;
    dataParams.push(limit, offset);

    const dataSql = `
      SELECT id, medical_record_number, nik, name, gender, dob, phone, address, created_at
      FROM patients
      ${whereClause}
      ORDER BY id DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const dataResult = await db.query(dataSql, dataParams);

    return sendPaginated(
      res,
      'Patients retrieved successfully',
      dataResult.rows,
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
 * @desc    Get single patient details by ID
 * @route   GET /api/patients/:id
 * @access  Protected (admin, receptionist, doctor)
 */
const getPatientById = async (req, res, next) => {
  try {
    const patientId = parseInt(req.params.id, 10);
    if (isNaN(patientId)) {
      return sendError(res, 'Invalid patient ID format', { id: 'Must be an integer' }, 400);
    }

    const result = await db.query(
      `SELECT id, medical_record_number, nik, name, gender, dob, phone, address, created_at
       FROM patients
       WHERE id = $1`,
      [patientId]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'Patient not found', {}, 404);
    }

    return sendSuccess(res, 'Patient retrieved successfully', result.rows[0], 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new patient record
 * @route   POST /api/patients
 * @access  Protected (admin, receptionist)
 */
const createPatient = async (req, res, next) => {
  try {
    const { nik, name, gender, dob, phone, address } = req.body;
    const errors = {};

    // 1. Validation: NIK
    if (!nik || typeof nik !== 'string') {
      errors.nik = 'NIK is required and must be a string';
    } else if (!/^\d{16}$/.test(nik.trim())) {
      errors.nik = 'NIK must be exactly 16 digits';
    }

    // 2. Validation: Name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.name = 'Patient name is required';
    }

    // 3. Validation: Gender
    const validGenders = ['L', 'P', 'Male', 'Female'];
    if (!gender || !validGenders.includes(gender)) {
      errors.gender = `Gender is required and must be one of: ${validGenders.join(', ')}`;
    }

    // 4. Validation: DOB (YYYY-MM-DD)
    if (!dob || typeof dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dob.trim()) || isNaN(Date.parse(dob.trim()))) {
      errors.dob = 'Date of birth is required and must be a valid date in YYYY-MM-DD format';
    }

    if (Object.keys(errors).length > 0) {
      return sendError(res, 'Validation error', errors, 400);
    }

    const cleanNik = nik.trim();
    const cleanName = name.trim();
    const cleanDob = dob.trim();
    const cleanPhone = phone && typeof phone === 'string' ? phone.trim() : null;
    const cleanAddress = address && typeof address === 'string' ? address.trim() : null;

    // 5. Duplicate Check: NIK
    const existingNik = await db.query('SELECT id FROM patients WHERE nik = $1', [cleanNik]);
    if (existingNik.rows.length > 0) {
      return sendError(res, 'NIK already registered', { nik: 'NIK already registered' }, 409);
    }

    // 6. Generate Medical Record Number & Insert (with collision retry safeguard)
    let newPatient = null;
    let attempts = 0;

    while (attempts < 3) {
      try {
        const medicalRecordNumber = await generateMedicalRecordNumber();
        const insertResult = await db.query(
          `INSERT INTO patients (medical_record_number, nik, name, gender, dob, phone, address)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, medical_record_number, nik, name, gender, dob, phone, address, created_at`,
          [medicalRecordNumber, cleanNik, cleanName, gender, cleanDob, cleanPhone, cleanAddress]
        );
        newPatient = insertResult.rows[0];
        break;
      } catch (err) {
        // Unique constraint violation code in PostgreSQL is 23505
        if (err.code === '23505' && err.detail?.includes('medical_record_number')) {
          attempts++;
          continue;
        }
        throw err;
      }
    }

    if (!newPatient) {
      return sendError(res, 'Failed to generate a unique Medical Record Number. Please try again.', {}, 500);
    }

    return sendSuccess(res, 'Patient created successfully', newPatient, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update patient information
 * @route   PUT /api/patients/:id
 * @access  Protected (admin, receptionist)
 */
const updatePatient = async (req, res, next) => {
  try {
    const patientId = parseInt(req.params.id, 10);
    if (isNaN(patientId)) {
      return sendError(res, 'Invalid patient ID format', { id: 'Must be an integer' }, 400);
    }

    // 1. Verify patient exists
    const existingResult = await db.query('SELECT * FROM patients WHERE id = $1', [patientId]);
    if (existingResult.rows.length === 0) {
      return sendError(res, 'Patient not found', {}, 404);
    }

    const currentPatient = existingResult.rows[0];
    const { nik, name, gender, dob, phone, address } = req.body;
    const errors = {};

    // 2. Validate NIK if provided
    let cleanNik = currentPatient.nik;
    if (nik !== undefined) {
      if (typeof nik !== 'string' || !/^\d{16}$/.test(nik.trim())) {
        errors.nik = 'NIK must be exactly 16 digits';
      } else {
        cleanNik = nik.trim();
        // Check collision with another patient
        const collisionCheck = await db.query(
          'SELECT id FROM patients WHERE nik = $1 AND id != $2',
          [cleanNik, patientId]
        );
        if (collisionCheck.rows.length > 0) {
          return sendError(res, 'NIK already registered to another patient', { nik: 'NIK already registered' }, 409);
        }
      }
    }

    // 3. Validate Name if provided
    let cleanName = currentPatient.name;
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        errors.name = 'Patient name cannot be empty';
      } else {
        cleanName = name.trim();
      }
    }

    // 4. Validate Gender if provided
    let cleanGender = currentPatient.gender;
    const validGenders = ['L', 'P', 'Male', 'Female'];
    if (gender !== undefined) {
      if (!validGenders.includes(gender)) {
        errors.gender = `Gender must be one of: ${validGenders.join(', ')}`;
      } else {
        cleanGender = gender;
      }
    }

    // 5. Validate DOB if provided
    let cleanDob = currentPatient.dob;
    if (dob !== undefined) {
      if (typeof dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dob.trim()) || isNaN(Date.parse(dob.trim()))) {
        errors.dob = 'Date of birth must be a valid date in YYYY-MM-DD format';
      } else {
        cleanDob = dob.trim();
      }
    }

    if (Object.keys(errors).length > 0) {
      return sendError(res, 'Validation error', errors, 400);
    }

    const cleanPhone = phone !== undefined ? (phone && typeof phone === 'string' ? phone.trim() : null) : currentPatient.phone;
    const cleanAddress = address !== undefined ? (address && typeof address === 'string' ? address.trim() : null) : currentPatient.address;

    // 6. Execute update (medical_record_number remains IMMUTABLE)
    const updateResult = await db.query(
      `UPDATE patients
       SET nik = $1, name = $2, gender = $3, dob = $4, phone = $5, address = $6
       WHERE id = $7
       RETURNING id, medical_record_number, nik, name, gender, dob, phone, address, created_at`,
      [cleanNik, cleanName, cleanGender, cleanDob, cleanPhone, cleanAddress, patientId]
    );

    return sendSuccess(res, 'Patient updated successfully', updateResult.rows[0], 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete patient record with relational integrity check
 * @route   DELETE /api/patients/:id
 * @access  Protected (admin, receptionist)
 */
const deletePatient = async (req, res, next) => {
  try {
    const patientId = parseInt(req.params.id, 10);
    if (isNaN(patientId)) {
      return sendError(res, 'Invalid patient ID format', { id: 'Must be an integer' }, 400);
    }

    // 1. Verify patient exists
    const checkResult = await db.query('SELECT id, name FROM patients WHERE id = $1', [patientId]);
    if (checkResult.rows.length === 0) {
      return sendError(res, 'Patient not found', {}, 404);
    }

    // 2. Check relational integrity: registrations & medical_records
    const regCheck = await db.query(
      'SELECT COUNT(*) AS total FROM registrations WHERE patient_id = $1',
      [patientId]
    );
    const medCheck = await db.query(
      'SELECT COUNT(*) AS total FROM medical_records WHERE patient_id = $1',
      [patientId]
    );

    const regCount = parseInt(regCheck.rows[0].total, 10);
    const medCount = parseInt(medCheck.rows[0].total, 10);

    if (regCount > 0 || medCount > 0) {
      return sendError(
        res,
        'Cannot delete patient: Patient has existing medical or registration records',
        {
          registrationsCount: regCount,
          medicalRecordsCount: medCount,
        },
        400
      );
    }

    // 3. Perform safe deletion
    await db.query('DELETE FROM patients WHERE id = $1', [patientId]);

    return sendSuccess(res, 'Patient deleted successfully', { id: patientId }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};
