/**
 * Validation middleware using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation results - returns 400 if validation fails
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Common validators
const emailValidator = body('email').isEmail().normalizeEmail().withMessage('Valid email required');
const passwordValidator = body('password')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters');
const phoneValidator = body('phone_number')
  .optional()
  .matches(/^[\d\s\-\+\(\)]{10,20}$/)
  .withMessage('Invalid phone number format');

// Auth validators
const registerValidators = [
  emailValidator,
  passwordValidator,
  body('full_name').trim().notEmpty().withMessage('Full name required'),
  body('role').isIn(['patient', 'doctor']).withMessage('Role must be patient or doctor'),
  phoneValidator,
  body('specialization').optional().trim(),
  body('license_number').optional().trim(),
  body('years_of_experience').optional().isInt({ min: 0 }),
  body('consultation_fee').optional().isFloat({ min: 0 }),
  body('bio').optional().trim(),
  body('date_of_birth').optional().isDate(),
  body('blood_type').optional().trim(),
  body('allergies').optional().trim(),
  body('medical_history').optional().trim(),
];

const loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

// Appointment validators
const createAppointmentValidators = [
  body('doctor_id').isUUID().withMessage('Valid doctor ID required'),
  body('appointment_date').isDate().withMessage('Valid date required'),
  body('appointment_time').matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('Valid time required (HH:MM)'),
  body('consultation_type').optional().isIn(['in-person', 'video']),
  body('notes').optional().trim(),
  body('patient_id').optional().isUUID().withMessage('Valid patient ID (for admin)'),
];

// Review validators
const createReviewValidators = [
  body('appointment_id').isUUID().withMessage('Valid appointment ID required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('comment').optional().trim().isLength({ max: 1000 }),
];

module.exports = {
  handleValidationErrors,
  registerValidators,
  loginValidators,
  createAppointmentValidators,
  createReviewValidators,
};
