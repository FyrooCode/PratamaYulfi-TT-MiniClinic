const express = require('express');
const router = express.Router();

const medicalRecordController = require('../controllers/medical-record.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// All medical record routes require authentication
router.use(authenticate);

// 1. Create medical record (SOAP) and optional prescriptions (Doctor only)
router.post('/', authorize('doctor'), medicalRecordController.createMedicalRecord);

// 2. Get medical record detail by ID (Doctor & Admin)
// Note: Must be placed BEFORE /:patientId to avoid route collision with literal path 'detail'
router.get('/detail/:id', authorize('doctor', 'admin'), medicalRecordController.getMedicalRecordDetail);

// 3. Get all medical records history for a patient (Doctor & Admin)
router.get('/:patientId', authorize('doctor', 'admin'), medicalRecordController.getPatientMedicalRecords);

module.exports = router;
