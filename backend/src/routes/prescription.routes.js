const express = require('express');
const router = express.Router();

const prescriptionController = require('../controllers/prescription.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// All prescription routes require authentication
router.use(authenticate);

// 1. Create prescription item (Doctor only)
router.post('/', authorize('doctor'), prescriptionController.createPrescription);

// 2. Get prescription detail by ID (Doctor, Admin, Receptionist)
router.get('/:id', authorize('doctor', 'admin', 'receptionist'), prescriptionController.getPrescriptionById);

module.exports = router;
