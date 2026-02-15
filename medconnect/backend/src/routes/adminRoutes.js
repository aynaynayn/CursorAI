/**
 * Admin routes
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/users', adminController.getUsers);
router.get('/statistics', adminController.getStatistics);
router.get('/appointments', adminController.getAllAppointments);
router.put('/doctors/:id/verify', adminController.verifyDoctor);
router.put('/doctors/:id/unverify', adminController.unverifyDoctor);

module.exports = router;
