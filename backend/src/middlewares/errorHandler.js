const { sendError } = require('../utils/response');

// Global Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  console.error('[Error Occurred]:', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || (process.env.NODE_ENV === 'development' ? { stack: err.stack } : {});

  return sendError(res, message, errors, statusCode);
};

// 404 Route Not Found Middleware
const notFoundHandler = (req, res, next) => {
  return sendError(res, `Route not found - ${req.method} ${req.originalUrl}`, {}, 404);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
