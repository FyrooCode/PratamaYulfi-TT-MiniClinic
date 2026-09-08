/**
 * Standard API Response Helper
 * Memastikan seluruh respons API menghasilkan format baku sesuai spesifikasi:
 * - Success: { "success": true, "message": "...", "data": { ... } }
 * - Error:   { "success": false, "message": "...", "errors": { ... } }
 */

/**
 * Send standard success response
 * @param {import('express').Response} res
 * @param {string} [message='Success']
 * @param {any} [data={}]
 * @param {number} [statusCode=200]
 */
const sendSuccess = (res, message = 'Success', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send standard error response
 * @param {import('express').Response} res
 * @param {string} [message='An error occurred']
 * @param {any} [errors={}]
 * @param {number} [statusCode=500]
 */
const sendError = (res, message = 'An error occurred', errors = {}, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

/**
 * Send standard paginated response
 * @param {import('express').Response} res
 * @param {string} [message='Success']
 * @param {any[]} [data=[]]
 * @param {object} [pagination={}]
 * @param {number} [statusCode=200]
 */
const sendPaginated = (res, message = 'Success', data = [], pagination = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  });
};

/**
 * Custom application error with HTTP status code and field-level validation errors
 */
class AppError extends Error {
  constructor(message, statusCode = 400, errors = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  sendSuccess,
  sendPaginated,
  sendError,
  AppError,
};
