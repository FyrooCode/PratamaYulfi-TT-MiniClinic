const express = require('express');
const router = express.Router();

const patientController = require('../controllers/patient.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// All patient endpoints require authentication
router.use(authenticate);

// Read endpoints: Allowed for admin, receptionist, and doctor
router.get('/', authorize('admin', 'receptionist', 'doctor'), patientController.getAllPatients);
router.get('/:id', authorize('admin', 'receptionist', 'doctor'), patientController.getPatientById);

// Mutation endpoints: Allowed strictly for admin and receptionist (Doctor forbidden)
router.post('/', authorize('admin', 'receptionist'), patientController.createPatient);
router.put('/:id', authorize('admin', 'receptionist'), patientController.updatePatient);
router.delete('/:id', authorize('admin', 'receptionist'), patientController.deletePatient);

module.exports = router;
