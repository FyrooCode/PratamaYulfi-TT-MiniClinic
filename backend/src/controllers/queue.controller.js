const db = require('../config/db');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { generateQueueNumber } = require('../utils/generator');

const VALID_QUEUE_STATUSES = ['Menunggu', 'Check In', 'Pemeriksaan', 'Selesai', 'Batal'];

/**
 * @desc    Public Display Queues for Lobby TV Monitor (No Auth Required)
 * @route   GET /api/queues/display
 * @access  Public
 */
const getDisplayQueues = async (req, res, next) => {
  try {
    const { clinic_department } = req.query;

    const queryParams = [];
    let deptFilter = '';

    if (clinic_department && typeof clinic_department === 'string' && clinic_department.trim()) {
      queryParams.push(`%${clinic_department.trim()}%`);
      deptFilter = `AND r.clinic_department ILIKE $${queryParams.length}`;
    }

    // 1. Current Calling Queue (Status: 'Check In' or 'Pemeriksaan' today, sorted by latest updated_at)
    const callingSql = `
      SELECT 
        q.id,
        q.queue_number,
        q.status,
        q.created_at,
        q.updated_at,
        r.clinic_department,
        p.name AS patient_name,
        u.name AS doctor_name
      FROM queues q
      JOIN registrations r ON q.registration_id = r.id
      JOIN patients p ON r.patient_id = p.id
      LEFT JOIN users u ON r.doctor_id = u.id
      WHERE q.status IN ('Check In', 'Pemeriksaan')
        AND q.created_at::DATE = CURRENT_DATE
        ${deptFilter}
      ORDER BY q.updated_at DESC
      LIMIT 1
    `;

    const callingResult = await db.query(callingSql, queryParams);
    const currentCalling = callingResult.rows.length > 0 ? callingResult.rows[0] : null;

    // 2. Upcoming Waiting Queues (Status: 'Menunggu' today, max 5)
    const upcomingSql = `
      SELECT 
        q.id,
        q.queue_number,
        q.status,
        q.created_at,
        q.updated_at,
        r.clinic_department,
        p.name AS patient_name,
        u.name AS doctor_name
      FROM queues q
      JOIN registrations r ON q.registration_id = r.id
      JOIN patients p ON r.patient_id = p.id
      LEFT JOIN users u ON r.doctor_id = u.id
      WHERE q.status = 'Menunggu'
        AND q.created_at::DATE = CURRENT_DATE
        ${deptFilter}
      ORDER BY q.id ASC
      LIMIT 5
    `;

    const upcomingResult = await db.query(upcomingSql, queryParams);

    return sendSuccess(
      res,
      'Display queues retrieved successfully',
      {
        current_calling: currentCalling,
        upcoming_queues: upcomingResult.rows,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all queues with pagination, filters, and joins (Internal Master Antrean)
 * @route   GET /api/queues
 * @access  Protected (admin, receptionist, doctor)
 */
const getAllQueues = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 10,
      status = '',
      clinic_department = '',
      date = '',
    } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const offset = (page - 1) * limit;

    const whereClauses = [];
    const queryParams = [];

    // Date Filter (defaults to CURRENT_DATE, unless specified as 'all')
    if (date && typeof date === 'string') {
      if (date.trim().toLowerCase() !== 'all') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
          queryParams.push(date.trim());
          whereClauses.push(`q.created_at::DATE = $${queryParams.length}`);
        } else {
          whereClauses.push(`q.created_at::DATE = CURRENT_DATE`);
        }
      }
    } else {
      whereClauses.push(`q.created_at::DATE = CURRENT_DATE`);
    }

    // Status Filter
    if (status && typeof status === 'string' && status.trim()) {
      queryParams.push(status.trim());
      whereClauses.push(`q.status = $${queryParams.length}`);
    }

    // Clinic Department Filter
    if (clinic_department && typeof clinic_department === 'string' && clinic_department.trim()) {
      queryParams.push(`%${clinic_department.trim()}%`);
      whereClauses.push(`r.clinic_department ILIKE $${queryParams.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count Total
    const countSql = `
      SELECT COUNT(*) AS total
      FROM queues q
      JOIN registrations r ON q.registration_id = r.id
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
        q.id,
        q.registration_id,
        q.queue_number,
        q.status,
        q.created_at,
        q.updated_at,
        r.registration_number,
        r.clinic_department,
        r.visit_date,
        p.id AS patient_id,
        p.name AS patient_name,
        p.medical_record_number,
        u.id AS doctor_id,
        u.name AS doctor_name
      FROM queues q
      JOIN registrations r ON q.registration_id = r.id
      JOIN patients p ON r.patient_id = p.id
      LEFT JOIN users u ON r.doctor_id = u.id
      ${whereSql}
      ORDER BY q.id ASC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const dataResult = await db.query(dataSql, dataParams);

    const formattedData = dataResult.rows.map((row) => ({
      id: row.id,
      queue_number: row.queue_number,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      registration: {
        id: row.registration_id,
        registration_number: row.registration_number,
        clinic_department: row.clinic_department,
        visit_date: row.visit_date,
      },
      patient: {
        id: row.patient_id,
        name: row.patient_name,
        medical_record_number: row.medical_record_number,
      },
      doctor: row.doctor_id
        ? {
            id: row.doctor_id,
            name: row.doctor_name,
          }
        : null,
    }));

    return sendPaginated(
      res,
      'Queues retrieved successfully',
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
 * @desc    Explicitly create a queue ticket for a registration
 * @route   POST /api/queues
 * @access  Protected (admin, receptionist)
 */
const createQueue = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { registration_id } = req.body;

    const parsedRegId = parseInt(registration_id, 10);
    if (!registration_id || isNaN(parsedRegId) || parsedRegId <= 0) {
      return sendError(res, 'Validation error', { registration_id: 'registration_id is required and must be a positive integer' }, 400);
    }

    await client.query('BEGIN');

    // 1. Verify registration exists
    const regCheck = await client.query(
      `SELECT id, clinic_department, status FROM registrations WHERE id = $1`,
      [parsedRegId]
    );

    if (regCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return sendError(res, 'Registration not found', { registration_id: 'Registration with this ID does not exist' }, 404);
    }

    const registration = regCheck.rows[0];

    // 2. Check if queue ticket already exists for this registration
    const queueCheck = await client.query(
      `SELECT id, queue_number, status FROM queues WHERE registration_id = $1`,
      [parsedRegId]
    );

    if (queueCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return sendError(
        res,
        'Queue ticket already exists for this registration',
        {
          registration_id: 'This registration already has a queue ticket',
          existing_queue: queueCheck.rows[0],
        },
        409
      );
    }

    // 3. Generate sequential queue number for today
    const queueNumber = await generateQueueNumber(registration.clinic_department, client);

    // 4. Insert queue ticket with initial status 'Menunggu'
    const insertSql = `
      INSERT INTO queues (registration_id, queue_number, status)
      VALUES ($1, $2, 'Menunggu')
      RETURNING id, registration_id, queue_number, status, created_at, updated_at
    `;
    const insertResult = await client.query(insertSql, [parsedRegId, queueNumber]);

    await client.query('COMMIT');

    return sendSuccess(
      res,
      'Queue ticket created successfully',
      insertResult.rows[0],
      201
    );
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * @desc    Call patient queue by ID & synchronize registration status to 'Check In'
 * @route   PUT /api/queues/:id/call
 * @access  Protected (admin, receptionist, doctor)
 */
const callQueueById = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const queueId = parseInt(req.params.id, 10);
    if (isNaN(queueId) || queueId <= 0) {
      return sendError(res, 'Invalid queue ID format', { id: 'Must be a positive integer' }, 400);
    }

    await client.query('BEGIN');

    // 1. Verify queue exists with row lock
    const checkSql = `
      SELECT 
        q.id,
        q.registration_id,
        q.queue_number,
        q.status,
        r.clinic_department,
        r.patient_id,
        r.doctor_id
      FROM queues q
      JOIN registrations r ON q.registration_id = r.id
      WHERE q.id = $1
      FOR UPDATE OF q
    `;
    const checkResult = await client.query(checkSql, [queueId]);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return sendError(res, 'Queue not found', {}, 404);
    }

    const queueData = checkResult.rows[0];

    // 2. Validate state machine: Cannot call patient who is already in examination, finished, or cancelled
    if (['Pemeriksaan', 'Selesai', 'Batal'].includes(queueData.status)) {
      await client.query('ROLLBACK');
      return sendError(
        res,
        `Cannot call queue: Patient is currently '${queueData.status}'`,
        {
          status: `Queue is currently '${queueData.status}'. Only waiting ('Menunggu') or re-calling ('Check In') queues can be called.`,
        },
        400
      );
    }

    // 3. Update Queue status to 'Check In' with explicit updated_at
    const updateQueueSql = `
      UPDATE queues
      SET status = 'Check In', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, registration_id, queue_number, status, created_at, updated_at
    `;
    const updateResult = await client.query(updateQueueSql, [queueId]);

    // 3. Synchronize Registration status to 'Check In' with explicit updated_at
    await client.query(
      `UPDATE registrations
       SET status = 'Check In', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [queueData.registration_id]
    );

    // 4. Fetch details for response
    const detailSql = `
      SELECT 
        p.name AS patient_name,
        p.medical_record_number,
        u.name AS doctor_name
      FROM patients p
      LEFT JOIN users u ON u.id = $2
      WHERE p.id = $1
    `;
    const detailResult = await client.query(detailSql, [queueData.patient_id, queueData.doctor_id]);
    const details = detailResult.rows[0];

    await client.query('COMMIT');

    const responseData = {
      ...updateResult.rows[0],
      clinic_department: queueData.clinic_department,
      patient: {
        id: queueData.patient_id,
        name: details?.patient_name,
        medical_record_number: details?.medical_record_number,
      },
      doctor: queueData.doctor_id
        ? {
            id: queueData.doctor_id,
            name: details?.doctor_name,
          }
        : null,
    };

    return sendSuccess(res, 'Queue called successfully', responseData, 200);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * @desc    Call next waiting patient queue globally & sync registration status to 'Check In'
 * @route   POST /api/queues/next
 * @access  Protected (admin, receptionist)
 */
const callNextQueue = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Find earliest waiting queue globally today with row lock FOR UPDATE
    const selectSql = `
      SELECT 
        q.id,
        q.registration_id,
        q.queue_number,
        q.status,
        r.clinic_department,
        r.patient_id,
        r.doctor_id
      FROM queues q
      JOIN registrations r ON q.registration_id = r.id
      WHERE q.status = 'Menunggu'
        AND q.created_at::DATE = CURRENT_DATE
      ORDER BY q.id ASC
      FOR UPDATE OF q
      LIMIT 1
    `;

    const selectResult = await client.query(selectSql);

    if (selectResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return sendError(res, 'No waiting queue found', {}, 404);
    }

    const nextQueue = selectResult.rows[0];

    // 2. Update Queue status to 'Check In' with explicit updated_at
    const queueUpdateSql = `
      UPDATE queues
      SET status = 'Check In', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, queue_number, status, created_at, updated_at
    `;
    const queueUpdateResult = await client.query(queueUpdateSql, [nextQueue.id]);

    // 3. Two-Way Sync: Update Registration status to 'Check In' with explicit updated_at
    await client.query(
      `UPDATE registrations
       SET status = 'Check In', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [nextQueue.registration_id]
    );

    // 4. Fetch full joined details for response
    const detailSql = `
      SELECT 
        p.name AS patient_name,
        p.medical_record_number,
        u.name AS doctor_name
      FROM patients p
      LEFT JOIN users u ON u.id = $2
      WHERE p.id = $1
    `;
    const detailResult = await client.query(detailSql, [nextQueue.patient_id, nextQueue.doctor_id]);
    const details = detailResult.rows[0];

    await client.query('COMMIT');

    const responseData = {
      ...queueUpdateResult.rows[0],
      registration_id: nextQueue.registration_id,
      clinic_department: nextQueue.clinic_department,
      patient: {
        id: nextQueue.patient_id,
        name: details?.patient_name,
        medical_record_number: details?.medical_record_number,
      },
      doctor: nextQueue.doctor_id
        ? {
            id: nextQueue.doctor_id,
            name: details?.doctor_name,
          }
        : null,
    };

    return sendSuccess(res, 'Next queue called successfully', responseData, 200);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * @desc    Update queue status and synchronize registration status 1-to-1
 * @route   PUT /api/queues/:id/status, PATCH /api/queues/:id/status
 * @access  Protected (admin, receptionist, doctor)
 */
const updateQueueStatus = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const queueId = parseInt(req.params.id, 10);
    if (isNaN(queueId) || queueId <= 0) {
      return sendError(res, 'Invalid queue ID format', { id: 'Must be a positive integer' }, 400);
    }

    const { status } = req.body;
    if (!status || typeof status !== 'string' || !VALID_QUEUE_STATUSES.includes(status.trim())) {
      return sendError(
        res,
        'Invalid queue status',
        {
          status: `Status is required and must be one of: ${VALID_QUEUE_STATUSES.join(', ')}`,
        },
        400
      );
    }

    const cleanStatus = status.trim();

    await client.query('BEGIN');

    // 1. Verify queue exists
    const checkResult = await client.query(
      `SELECT q.id, q.registration_id, q.queue_number, q.status
       FROM queues q
       WHERE q.id = $1
       FOR UPDATE OF q`,
      [queueId]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return sendError(res, 'Queue not found', {}, 404);
    }

    const currentQueue = checkResult.rows[0];

    // 2. Update Queue Status with explicit updated_at
    const updateResult = await client.query(
      `UPDATE queues
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, registration_id, queue_number, status, created_at, updated_at`,
      [cleanStatus, queueId]
    );

    // 3. 1-to-1 Synchronization to Registrations table with explicit updated_at
    await client.query(
      `UPDATE registrations
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [cleanStatus, currentQueue.registration_id]
    );

    await client.query('COMMIT');

    return sendSuccess(
      res,
      'Queue status updated successfully',
      {
        ...updateResult.rows[0],
        registration_status_synchronized: cleanStatus,
      },
      200
    );
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  VALID_QUEUE_STATUSES,
  getDisplayQueues,
  getAllQueues,
  createQueue,
  callQueueById,
  callNextQueue,
  updateQueueStatus,
};
