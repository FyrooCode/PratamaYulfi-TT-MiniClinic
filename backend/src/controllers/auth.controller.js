const bcrypt = require('bcrypt');
const db = require('../config/db');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require('../utils/token');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * @desc    Login user & issue Access Token (In-Memory) + Refresh Token (HttpOnly Cookie)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', {
        email: !email ? 'Email is required' : undefined,
        password: !password ? 'Password is required' : undefined,
      }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user by email
    const result = await db.query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'Invalid email or password', {}, 401);
    }

    const user = result.rows[0];

    // Verify bcrypt password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid email or password', {}, 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token in database & reset token_invalidated_at for fresh session
    await db.query(
      'UPDATE users SET refresh_token = $1, token_invalidated_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [refreshToken, user.id]
    );

    // Attach Refresh Token as HttpOnly, Secure Cookie
    setRefreshTokenCookie(res, refreshToken);

    return sendSuccess(
      res,
      'Login successful',
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Renew Access Token using HttpOnly Refresh Token Cookie
 * @route   POST /api/auth/refresh
 * @access  Public (Requires HttpOnly Cookie)
 */
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return sendError(res, 'Refresh token cookie is missing', {}, 401);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      clearRefreshTokenCookie(res);
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Refresh token has expired. Please login again.', { code: 'REFRESH_TOKEN_EXPIRED' }, 401);
      }
      return sendError(res, 'Invalid refresh token', {}, 401);
    }

    // Verify user exists and check for token reuse / revocation
    const result = await db.query(
      'SELECT id, name, email, role, refresh_token FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      clearRefreshTokenCookie(res);
      return sendError(res, 'User no longer exists', {}, 401);
    }

    const user = result.rows[0];

    if (user.refresh_token !== token) {
      // Token mismatch indicates token revocation or reuse attack
      clearRefreshTokenCookie(res);
      return sendError(res, 'Refresh token is invalid or has been revoked', {}, 403);
    }

    // Token rotation: Generate new access & refresh token pair
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await db.query('UPDATE users SET refresh_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      newRefreshToken,
      user.id,
    ]);

    setRefreshTokenCookie(res, newRefreshToken);

    return sendSuccess(
      res,
      'Token refreshed successfully',
      {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user, invalidate DB refresh token, record token_invalidated_at, & clear HttpOnly Cookie
 * @route   POST /api/auth/logout
 * @access  Public / Semi-authenticated
 */
const logout = async (req, res, next) => {
  try {
    let userId = null;

    // 1. Try to extract user from Authorization Bearer token (e.g. from Postman / client header)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = verifyAccessToken(token);
        userId = decoded.id;
      } catch (_) {
        // Token might already be expired or invalid, ignore here
      }
    }

    // 2. Check HttpOnly refreshToken cookie
    const refreshTokenCookie = req.cookies?.refreshToken;

    if (userId) {
      await db.query(
        'UPDATE users SET refresh_token = NULL, token_invalidated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
    } else if (refreshTokenCookie) {
      await db.query(
        'UPDATE users SET refresh_token = NULL, token_invalidated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE refresh_token = $1',
        [refreshTokenCookie]
      );
    }

    clearRefreshTokenCookie(res);

    return sendSuccess(res, 'Logout successful', {}, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user profile
 * @route   GET /api/auth/me
 * @access  Protected
 */
const getMe = async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      'User profile retrieved successfully',
      {
        user: req.user,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  getMe,
};
