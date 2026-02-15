/**
 * Review routes
 */

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middleware/auth');
const { createReviewValidators, handleValidationErrors } = require('../middleware/validation');

router.post('/', authenticate, authorize('patient'), createReviewValidators, handleValidationErrors, reviewController.createReview);
router.get('/doctor/:doctorId', reviewController.getDoctorReviews);

module.exports = router;
