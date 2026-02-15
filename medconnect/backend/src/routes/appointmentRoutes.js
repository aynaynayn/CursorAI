/**
 * Appointment routes
 */

const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { createAppointmentValidators, handleValidationErrors } = require('../middleware/validation');

router.get('/available-slots/:doctorId/:date', appointmentController.getAvailableSlots);

router.post('/', authenticate, createAppointmentValidators, handleValidationErrors, appointmentController.createAppointment);
router.get('/:id', authenticate, appointmentController.getAppointmentById);
router.put('/:id', authenticate, appointmentController.updateAppointment);
router.delete('/:id', authenticate, appointmentController.cancelAppointment);
router.post('/:id/complete', authenticate, authorize('doctor', 'admin'), appointmentController.completeAppointment);
router.post('/:id/prescription', authenticate, authorize('doctor', 'admin'), appointmentController.addPrescription);

module.exports = router;
