const express = require('express');
const router = express.Router();

const registrationController = require('../controllers/registration.controller');
const visitStatusController = require('../controllers/visit-status.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// All registration routes require authentication
router.use(authenticate);

// 1. Helper Dropdown Dokter (Must be declared before /:id)
router.get('/doctors', authorize('admin', 'receptionist'), registrationController.getDoctorsDropdown);

// 2. Read Endpoints (Admin, Receptionist, Doctor)
router.get('/', authorize('admin', 'receptionist', 'doctor'), registrationController.getAllRegistrations);
router.get('/:id', authorize('admin', 'receptionist', 'doctor'), registrationController.getRegistrationById);

// 3. Mutation Endpoints (Admin & Receptionist only; Doctor is forbidden)
router.post('/', authorize('admin', 'receptionist'), registrationController.createRegistration);
router.put('/:id', authorize('admin', 'receptionist'), registrationController.updateRegistration);
router.delete('/:id', authorize('admin', 'receptionist'), registrationController.deleteRegistration);

// 4. Centralized Status Transition Endpoint (Doctor is allowed to update status during examination)
router.patch('/:id/status', authorize('admin', 'receptionist', 'doctor'), visitStatusController.updateVisitStatus);

module.exports = router;
