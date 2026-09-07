const { verifyAccessToken } = require('../utils/token');
const { sendError, AppError } = require('../utils/response');
const db = require('../config/db');

/**
 * Authentication Middleware
 * Validates JWT Access Token from 'Authorization: Bearer <token>' header
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. Missing or malformed token.', {}, 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'Authentication token missing.', {}, 401);
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Access token has expired', { code: 'TOKEN_EXPIRED' }, 401);
      }
      return sendError(res, 'Invalid access token', {}, 401);
    }

    // Verify user still exists in database & check if token was revoked
    const userQuery = await db.query(
      'SELECT id, name, email, role, token_invalidated_at, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userQuery.rows.length === 0) {
      return sendError(res, 'User associated with this token no longer exists', {}, 401);
    }

    const user = userQuery.rows[0];

    // Check if token was revoked (e.g. user logged out after token was issued)
    if (user.token_invalidated_at) {
      const tokenIssuedAtMs = decoded.iat * 1000;
      const invalidatedAtMs = new Date(user.token_invalidated_at).getTime();

      if (tokenIssuedAtMs < invalidatedAtMs) {
        return sendError(
          res,
          'Token has been revoked. Please login again.',
          { code: 'TOKEN_REVOKED' },
          401
        );
      }
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-Based Authorization Middleware
 * @param  {...string} allowedRoles Allowed roles: 'admin', 'doctor', 'receptionist'
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required before checking permissions', {}, 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Forbidden: Access denied for role '${req.user.role}'`,
        {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
        },
        403
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
