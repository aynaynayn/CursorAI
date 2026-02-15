/**
 * Patient routes
 */

const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/:id', authenticate, patientController.getPatientById);
router.put('/:id', authenticate, patientController.updatePatient);
router.get('/:id/appointments', authenticate, patientController.getPatientAppointments);

module.exports = router;
