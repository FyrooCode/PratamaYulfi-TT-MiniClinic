const express = require('express');
const router = express.Router();

const queueController = require('../controllers/queue.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// 1. Public Endpoint for Lobby TV Display Monitor (NO Auth required)
router.get('/display', queueController.getDisplayQueues);

// 2. Protected Endpoints (Require Authentication)
router.use(authenticate);

// List all queues for internal queue management
router.get('/', authorize('admin', 'receptionist', 'doctor'), queueController.getAllQueues);

// Explicitly create a queue ticket for a registration
router.post('/', authorize('admin', 'receptionist'), queueController.createQueue);

// Helper: Call next waiting queue (admin & receptionist only)
router.post('/next', authorize('admin', 'receptionist'), queueController.callNextQueue);

// Call specific queue by ID (admin & receptionist only)
router.put('/:id/call', authorize('admin', 'receptionist'), queueController.callQueueById);

// Update queue status with 1-to-1 registration status sync
router.put('/:id/status', authorize('admin', 'receptionist', 'doctor'), queueController.updateQueueStatus);
router.patch('/:id/status', authorize('admin', 'receptionist', 'doctor'), queueController.updateQueueStatus);

module.exports = router;
