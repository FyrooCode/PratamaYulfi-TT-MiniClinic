const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * @desc    Create standalone prescription item for a medical record
 * @route   POST /api/prescriptions
 * @access  Protected (doctor only)
 */
const createPrescription = async (req, res, next) => {
  try {
    const {
      medical_record_id,
      medicine_name,
      dosage,
      frequency,
      quantity = 1,
      instructions,
    } = req.body;

    const errors = {};

    const parsedMrId = parseInt(medical_record_id, 10);
    if (!medical_record_id || isNaN(parsedMrId) || parsedMrId <= 0) {
      errors.medical_record_id = 'medical_record_id is required and must be a positive integer';
    }

    if (!medicine_name || typeof medicine_name !== 'string' || !medicine_name.trim()) {
      errors.medicine_name = 'medicine_name is required';
    }

    if (!dosage || typeof dosage !== 'string' || !dosage.trim()) {
      errors.dosage = 'dosage is required';
    }

    if (!frequency || typeof frequency !== 'string' || !frequency.trim()) {
      errors.frequency = 'frequency is required';
    }

    let cleanQty = 1;
    if (quantity !== undefined && quantity !== null) {
      const parsedQty = parseInt(quantity, 10);
      if (isNaN(parsedQty) || parsedQty <= 0) {
        errors.quantity = 'quantity must be a positive integer';
      } else {
        cleanQty = parsedQty;
      }
    }

    if (Object.keys(errors).length > 0) {
      return sendError(res, 'Validation error', errors, 400);
    }

    // 1. Verify medical_record exists
    const mrCheck = await db.query(
      `SELECT id, patient_id, registration_id FROM medical_records WHERE id = $1`,
      [parsedMrId]
    );

    if (mrCheck.rows.length === 0) {
      return sendError(res, 'Medical record not found', { medical_record_id: 'Medical record with this ID does not exist' }, 404);
    }

    const cleanInstructions = instructions && typeof instructions === 'string' ? instructions.trim() : null;

    // 2. Insert into prescriptions
    const insertSql = `
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

    const result = await db.query(insertSql, [
      parsedMrId,
      medicine_name.trim(),
      dosage.trim(),
      frequency.trim(),
      cleanQty,
      cleanInstructions,
    ]);

    return sendSuccess(res, 'Prescription created successfully', result.rows[0], 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single prescription details by ID
 * @route   GET /api/prescriptions/:id
 * @access  Protected (doctor, admin, receptionist)
 */
const getPrescriptionById = async (req, res, next) => {
  try {
    const prescriptionId = parseInt(req.params.id, 10);
    if (isNaN(prescriptionId) || prescriptionId <= 0) {
      return sendError(res, 'Invalid prescription ID format', { id: 'Must be a positive integer' }, 400);
    }

    const sql = `
      SELECT 
        pr.id,
        pr.medical_record_id,
        pr.medicine_name,
        pr.dosage,
        pr.frequency,
        pr.quantity,
        pr.instructions,
        pr.created_at,
        pr.updated_at,
        mr.patient_id,
        p.name AS patient_name,
        p.medical_record_number,
        mr.doctor_id,
        u.name AS doctor_name,
        r.registration_number,
        r.clinic_department
      FROM prescriptions pr
      JOIN medical_records mr ON pr.medical_record_id = mr.id
      JOIN patients p ON mr.patient_id = p.id
      LEFT JOIN users u ON mr.doctor_id = u.id
      LEFT JOIN registrations r ON mr.registration_id = r.id
      WHERE pr.id = $1
    `;

    const result = await db.query(sql, [prescriptionId]);

    if (result.rows.length === 0) {
      return sendError(res, 'Prescription not found', {}, 404);
    }

    return sendSuccess(res, 'Prescription retrieved successfully', result.rows[0], 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescription,
  getPrescriptionById,
};
