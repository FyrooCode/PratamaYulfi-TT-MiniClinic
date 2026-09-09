const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

const VALID_STATUSES = ['Menunggu', 'Check In', 'Pemeriksaan', 'Selesai'];

/**
 * @desc    Update visit status for a patient registration (Centralized State Transition)
 * @route   PATCH /api/registrations/:id/status
 * @access  Protected (admin, receptionist, doctor)
 */
const updateVisitStatus = async (req, res, next) => {
  try {
    const registrationId = parseInt(req.params.id, 10);
    if (isNaN(registrationId)) {
      return sendError(res, 'Invalid registration ID format', { id: 'Must be an integer' }, 400);
    }

    const { status } = req.body;
    if (!status || typeof status !== 'string' || !VALID_STATUSES.includes(status.trim())) {
      return sendError(
        res,
        'Invalid visit status',
        {
          status: `Status is required and must be one of: ${VALID_STATUSES.join(', ')}`,
        },
        400
      );
    }

    const cleanStatus = status.trim();

    // 1. Verify registration exists
    const checkResult = await db.query(
      `SELECT r.id, r.registration_number, r.status, r.patient_id, r.doctor_id
       FROM registrations r
       WHERE r.id = $1`,
      [registrationId]
    );

    if (checkResult.rows.length === 0) {
      return sendError(res, 'Registration not found', {}, 404);
    }

    // 2. Update status
    const updateResult = await db.query(
      `UPDATE registrations
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, registration_number, patient_id, doctor_id, clinic_department, visit_date, payment_type, initial_complaint, status, created_at, updated_at`,
      [cleanStatus, registrationId]
    );

    return sendSuccess(
      res,
      'Visit status updated successfully',
      updateResult.rows[0],
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  VALID_STATUSES,
  updateVisitStatus,
};
