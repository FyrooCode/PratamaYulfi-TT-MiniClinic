const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Controller to fetch dashboard aggregated statistics
 * Calculates 5 core operational metrics in a single efficient SQL query:
 * - total_patients: total rows in 'patients' table
 * - total_patients_today: unique patients visiting today (registrations with visit_date = CURRENT_DATE)
 * - total_queues_today: total queue tickets today (q JOIN r on r.visit_date = CURRENT_DATE)
 * - total_waiting: total queues with status 'Menunggu' today
 * - total_completed: total queues with status 'Selesai' today
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const query = `
      WITH today_queues AS (
        SELECT q.status
        FROM queues q
        JOIN registrations r ON q.registration_id = r.id
        WHERE r.visit_date = CURRENT_DATE
      )
      SELECT
        (SELECT COUNT(*)::int FROM patients) AS total_patients,
        (SELECT COUNT(DISTINCT patient_id)::int FROM registrations WHERE visit_date = CURRENT_DATE) AS total_patients_today,
        COUNT(*)::int AS total_queues_today,
        COUNT(*) FILTER (WHERE status = 'Menunggu')::int AS total_waiting,
        COUNT(*) FILTER (WHERE status = 'Selesai')::int AS total_completed
      FROM today_queues;
    `;

    const result = await db.query(query);
    const row = result.rows[0] || {};

    const stats = {
      total_patients: parseInt(row.total_patients || 0, 10),
      total_patients_today: parseInt(row.total_patients_today || 0, 10),
      total_queues_today: parseInt(row.total_queues_today || 0, 10),
      total_waiting: parseInt(row.total_waiting || 0, 10),
      total_completed: parseInt(row.total_completed || 0, 10),
    };

    return sendSuccess(res, 'Dashboard statistics retrieved successfully', stats, 200);
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return sendError(res, 'Internal server error', {}, 500);
  }
};

module.exports = {
  getDashboardStats,
};
