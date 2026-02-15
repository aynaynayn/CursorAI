/**
 * Doctor routes
 */

const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', doctorController.getDoctors);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/availability', doctorController.getAvailability);
router.get('/:id/appointments', authenticate, authorize('doctor', 'admin'), doctorController.getDoctorAppointments);
router.get('/:id/reviews', doctorController.getDoctorReviews);

router.put('/:id', authenticate, authorize('doctor', 'admin'), doctorController.updateDoctor);
router.post('/availability', authenticate, authorize('doctor', 'admin'), doctorController.setAvailability);

module.exports = router;
