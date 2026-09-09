const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');

// All dashboard endpoints require authentication
router.use(verifyToken);

// GET /api/dashboard/stats - Available for admin, receptionist, and doctor
router.get('/stats', authorize('admin', 'receptionist', 'doctor'), dashboardController.getDashboardStats);

module.exports = router;
