const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * @desc    Create new medical record (SOAP) and optional prescriptions
 * @route   POST /api/medical-records
 * @access  Protected (doctor only)
 */
const createMedicalRecord = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const doctor_id = req.user.id;
    const {
      registration_id,
      subjective,
      systolic_bp,
      diastolic_bp,
      temperature,
      weight,
      height,
      assessment,
      plan,
      medical_actions,
      prescription,
      medicines,
    } = req.body;

    const errors = {};

    // 1. Validate required fields
    const parsedRegId = parseInt(registration_id, 10);
    if (!registration_id || isNaN(parsedRegId) || parsedRegId <= 0) {
      errors.registration_id = 'registration_id is required and must be a positive integer';
    }

    if (!subjective || typeof subjective !== 'string' || subjective.trim().length === 0) {
      errors.subjective = 'subjective (S) anamnesis is required';
    }

    if (!assessment || typeof assessment !== 'string' || assessment.trim().length === 0) {
      errors.assessment = 'assessment (A) diagnosis is required';
    }

    if (!plan || typeof plan !== 'string' || plan.trim().length === 0) {
      errors.plan = 'plan (P) therapy/treatment plan is required';
    }

    // 2. Optional Vitals Validation
    let cleanSystolic = null;
    if (systolic_bp !== undefined && systolic_bp !== null && systolic_bp !== '') {
      const parsedSys = parseInt(systolic_bp, 10);
      if (isNaN(parsedSys) || parsedSys <= 0 || parsedSys > 350) {
        errors.systolic_bp = 'systolic_bp must be a valid number between 1 and 350';
      } else {
        cleanSystolic = parsedSys;
      }
    }

    let cleanDiastolic = null;
    if (diastolic_bp !== undefined && diastolic_bp !== null && diastolic_bp !== '') {
      const parsedDia = parseInt(diastolic_bp, 10);
      if (isNaN(parsedDia) || parsedDia <= 0 || parsedDia > 250) {
        errors.diastolic_bp = 'diastolic_bp must be a valid number between 1 and 250';
      } else {
        cleanDiastolic = parsedDia;
      }
    }

    let cleanTemp = null;
    if (temperature !== undefined && temperature !== null && temperature !== '') {
      const parsedTemp = parseFloat(temperature);
      if (isNaN(parsedTemp) || parsedTemp < 25.0 || parsedTemp > 45.0) {
        errors.temperature = 'temperature must be a valid number between 25.0 and 45.0';
      } else {
        cleanTemp = parsedTemp;
      }
    }

    let cleanWeight = null;
    if (weight !== undefined && weight !== null && weight !== '') {
      const parsedWeight = parseFloat(weight);
      if (isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight > 500) {
        errors.weight = 'weight must be a positive number up to 500 kg';
      } else {
        cleanWeight = parsedWeight;
      }
    }

    let cleanHeight = null;
    if (height !== undefined && height !== null && height !== '') {
      const parsedHeight = parseFloat(height);
      if (isNaN(parsedHeight) || parsedHeight <= 0 || parsedHeight > 300) {
        errors.height = 'height must be a positive number up to 300 cm';
      } else {
        cleanHeight = parsedHeight;
      }
    }

    // Validate medicines array if provided
    if (medicines !== undefined && medicines !== null) {
      if (!Array.isArray(medicines)) {
        errors.medicines = 'medicines must be an array of medicine objects';
      } else {
        for (let i = 0; i < medicines.length; i++) {
          const med = medicines[i];
          if (!med.medicine_name || typeof med.medicine_name !== 'string' || !med.medicine_name.trim()) {
            errors[`medicines[${i}].medicine_name`] = 'medicine_name is required';
          }
          if (!med.dosage || typeof med.dosage !== 'string' || !med.dosage.trim()) {
            errors[`medicines[${i}].dosage`] = 'dosage is required';
          }
          if (!med.frequency || typeof med.frequency !== 'string' || !med.frequency.trim()) {
            errors[`medicines[${i}].frequency`] = 'frequency is required';
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return sendError(res, 'Validation error', errors, 400);
    }

    await client.query('BEGIN');

    // 3. Verify Registration Exists
    const regCheck = await client.query(
      `SELECT r.id, r.patient_id, r.clinic_department, r.status
       FROM registrations r
       WHERE r.id = $1`,
      [parsedRegId]
    );

    if (regCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return sendError(res, 'Registration not found', { registration_id: 'Registration with this ID does not exist' }, 404);
    }

    const registration = regCheck.rows[0];

    // 4. Validate Duplicate Medical Record for this Registration
    const mrCheck = await client.query(
      `SELECT id FROM medical_records WHERE registration_id = $1`,
      [parsedRegId]
    );

    if (mrCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return sendError(
        res,
        'Medical record already exists for this registration',
        { registration_id: 'A medical record has already been recorded for this visit' },
        409
      );
    }

    // 5. Insert Medical Record
    const cleanSubjective = subjective.trim();
    const cleanAssessment = assessment.trim();
    const cleanPlan = plan.trim();
    const cleanActions = medical_actions && typeof medical_actions === 'string' ? medical_actions.trim() : null;
    const cleanPrescriptionNote = prescription && typeof prescription === 'string' ? prescription.trim() : null;

    const insertMrSql = `
      INSERT INTO medical_records (
        registration_id,
        patient_id,
        doctor_id,
        subjective,
        systolic_bp,
        diastolic_bp,
        temperature,
        weight,
        height,
        assessment,
        plan,
        medical_actions,
        prescription,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const mrResult = await client.query(insertMrSql, [
      parsedRegId,
      registration.patient_id,
      doctor_id,
      cleanSubjective,
      cleanSystolic,
      cleanDiastolic,
      cleanTemp,
      cleanWeight,
      cleanHeight,
      cleanAssessment,
      cleanPlan,
      cleanActions,
      cleanPrescriptionNote,
    ]);

    const createdMedicalRecord = mrResult.rows[0];

    // 6. Insert Medicines if provided
    const insertedMedicines = [];
    if (Array.isArray(medicines) && medicines.length > 0) {
      const insertMedSql = `
        INSERT INTO prescriptions (
          medical_record_id,
          medicine_name,
          dosage,
          frequency,
          quantity,
          instructions,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      for (const med of medicines) {
        const qty = parseInt(med.quantity, 10);
        const cleanQty = !isNaN(qty) && qty > 0 ? qty : 1;
        const cleanInstr = med.instructions && typeof med.instructions === 'string' ? med.instructions.trim() : null;

        const medResult = await client.query(insertMedSql, [
          createdMedicalRecord.id,
          med.medicine_name.trim(),
          med.dosage.trim(),
          med.frequency.trim(),
          cleanQty,
          cleanInstr,
        ]);
        insertedMedicines.push(medResult.rows[0]);
      }
    }

    // 7. Automated State Synchronization: Mark Registration & Queue as 'Selesai'
    await client.query(
      `UPDATE registrations
       SET status = 'Selesai', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [parsedRegId]
    );

    await client.query(
      `UPDATE queues
       SET status = 'Selesai', updated_at = CURRENT_TIMESTAMP
       WHERE registration_id = $1`,
      [parsedRegId]
    );

    await client.query('COMMIT');

    const responseData = {
      ...createdMedicalRecord,
      medicines: insertedMedicines,
      synchronized_status: {
        registration_status: 'Selesai',
        queue_status: 'Selesai',
      },
    };

    return sendSuccess(res, 'Medical record created successfully', responseData, 201);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * @desc    Get all medical records for a specific patient (Medical History)
 * @route   GET /api/medical-records/:patientId
 * @access  Protected (doctor, admin)
 */
const getPatientMedicalRecords = async (req, res, next) => {
  try {
    const patientId = parseInt(req.params.patientId, 10);
    if (isNaN(patientId) || patientId <= 0) {
      return sendError(res, 'Invalid patient ID format', { patientId: 'Must be a positive integer' }, 400);
    }

    // 1. Verify patient exists
    const patientCheck = await db.query(
      `SELECT id, name, medical_record_number, nik, dob, gender, phone, address
       FROM patients
       WHERE id = $1`,
      [patientId]
    );

    if (patientCheck.rows.length === 0) {
      return sendError(res, 'Patient not found', {}, 404);
    }

    const patient = patientCheck.rows[0];

    // 2. Fetch history of medical records with joined details and structured medicines
    const sql = `
      SELECT 
        mr.id,
        mr.registration_id,
        mr.patient_id,
        mr.doctor_id,
        mr.subjective,
        mr.systolic_bp,
        mr.diastolic_bp,
        mr.temperature,
        mr.weight,
        mr.height,
        mr.assessment,
        mr.plan,
        mr.medical_actions,
        mr.prescription,
        mr.created_at,
        mr.updated_at,
        u.name AS doctor_name,
        r.registration_number,
        r.clinic_department,
        r.visit_date,
        COALESCE(
          (SELECT json_agg(json_build_object(
             'id', pr.id,
             'medicine_name', pr.medicine_name,
             'dosage', pr.dosage,
             'frequency', pr.frequency,
             'quantity', pr.quantity,
             'instructions', pr.instructions,
             'created_at', pr.created_at,
             'updated_at', pr.updated_at
           ))
           FROM prescriptions pr
           WHERE pr.medical_record_id = mr.id
          ), '[]'::json
        ) AS medicines
      FROM medical_records mr
      JOIN registrations r ON mr.registration_id = r.id
      LEFT JOIN users u ON mr.doctor_id = u.id
      WHERE mr.patient_id = $1
      ORDER BY mr.created_at DESC
    `;

    const result = await db.query(sql, [patientId]);

    return sendSuccess(
      res,
      'Patient medical records retrieved successfully',
      {
        patient,
        medical_records: result.rows,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single medical record details by ID
 * @route   GET /api/medical-records/detail/:id
 * @access  Protected (doctor, admin)
 */
const getMedicalRecordDetail = async (req, res, next) => {
  try {
    const recordId = parseInt(req.params.id, 10);
    if (isNaN(recordId) || recordId <= 0) {
      return sendError(res, 'Invalid medical record ID format', { id: 'Must be a positive integer' }, 400);
    }

    const sql = `
      SELECT 
        mr.id,
        mr.registration_id,
        mr.patient_id,
        mr.doctor_id,
        mr.subjective,
        mr.systolic_bp,
        mr.diastolic_bp,
        mr.temperature,
        mr.weight,
        mr.height,
        mr.assessment,
        mr.plan,
        mr.medical_actions,
        mr.prescription,
        mr.created_at,
        mr.updated_at,
        p.name AS patient_name,
        p.medical_record_number,
        p.dob AS patient_dob,
        p.gender AS patient_gender,
        u.name AS doctor_name,
        r.registration_number,
        r.clinic_department,
        r.visit_date,
        COALESCE(
          (SELECT json_agg(json_build_object(
             'id', pr.id,
             'medicine_name', pr.medicine_name,
             'dosage', pr.dosage,
             'frequency', pr.frequency,
             'quantity', pr.quantity,
             'instructions', pr.instructions,
             'created_at', pr.created_at,
             'updated_at', pr.updated_at
           ))
           FROM prescriptions pr
           WHERE pr.medical_record_id = mr.id
          ), '[]'::json
        ) AS medicines
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN registrations r ON mr.registration_id = r.id
      LEFT JOIN users u ON mr.doctor_id = u.id
      WHERE mr.id = $1
    `;

    const result = await db.query(sql, [recordId]);

    if (result.rows.length === 0) {
      return sendError(res, 'Medical record not found', {}, 404);
    }

    return sendSuccess(res, 'Medical record retrieved successfully', result.rows[0], 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMedicalRecord,
  getPatientMedicalRecords,
  getMedicalRecordDetail,
};
