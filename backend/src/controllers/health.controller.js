const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

const getHealthStatus = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const dbResult = await db.query('SELECT NOW() as db_time, current_database() as db_name');
    
    // Quick counts to verify DDL initialized correctly
    let counts = {
      users: 0,
      patients: 0,
      registrations: 0,
      queues: 0,
      medical_records: 0,
      prescriptions: 0,
    };

    try {
      const userCountRes = await db.query('SELECT COUNT(*) FROM users');
      const patientCountRes = await db.query('SELECT COUNT(*) FROM patients');
      const registrationCountRes = await db.query('SELECT COUNT(*) FROM registrations');
      const queueCountRes = await db.query('SELECT COUNT(*) FROM queues');
      const medicalRecordCountRes = await db.query('SELECT COUNT(*) FROM medical_records');
      const prescriptionCountRes = await db.query('SELECT COUNT(*) FROM prescriptions');

      counts = {
        users: parseInt(userCountRes.rows[0].count, 10),
        patients: parseInt(patientCountRes.rows[0].count, 10),
        registrations: parseInt(registrationCountRes.rows[0].count, 10),
        queues: parseInt(queueCountRes.rows[0].count, 10),
        medical_records: parseInt(medicalRecordCountRes.rows[0].count, 10),
        prescriptions: parseInt(prescriptionCountRes.rows[0].count, 10),
      };
    } catch (countErr) {
      console.warn('Could not read table counts:', countErr.message);
    }

    const responseTime = Date.now() - startTime;

    return sendSuccess(
      res,
      'Mini Clinic Information System API is running healthy',
      {
        server: {
          status: 'UP',
          uptimeSeconds: Math.floor(process.uptime()),
          timestamp: new Date().toISOString(),
          nodeVersion: process.version,
          responseTimeMs: responseTime,
        },
        database: {
          status: 'CONNECTED',
          name: dbResult.rows[0].db_name,
          dbServerTime: dbResult.rows[0].db_time,
          records: counts,
        },
      },
      200
    );
  } catch (error) {
    return sendError(
      res,
      'API is running but Database connection failed',
      {
        database: error.message,
        server: {
          status: 'UP',
          uptimeSeconds: Math.floor(process.uptime()),
          timestamp: new Date().toISOString(),
        },
      },
      503
    );
  }
};

module.exports = {
  getHealthStatus,
};
