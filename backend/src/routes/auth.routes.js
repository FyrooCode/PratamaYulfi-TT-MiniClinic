const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { sendSuccess } = require('../utils/response');

// Public Auth Endpoints
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// Protected User Profile Endpoint
router.get('/me', authenticate, authController.getMe);

// Role-Based Access Control (RBAC) Verification Endpoints
router.get('/test/admin', authenticate, authorize('admin'), (req, res) => {
  return sendSuccess(res, 'Access granted: Administrator resource', {
    user: req.user,
    permission: 'full_system_access',
  });
});

router.get('/test/doctor', authenticate, authorize('doctor'), (req, res) => {
  return sendSuccess(res, 'Access granted: Doctor resource', {
    user: req.user,
    permission: 'clinical_and_medical_records',
  });
});

router.get('/test/receptionist', authenticate, authorize('receptionist'), (req, res) => {
  return sendSuccess(res, 'Access granted: Receptionist resource', {
    user: req.user,
    permission: 'registration_and_queues',
  });
});

module.exports = router;
