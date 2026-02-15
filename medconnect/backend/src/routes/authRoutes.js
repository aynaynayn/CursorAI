/**
 * Authentication routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerValidators, loginValidators, handleValidationErrors } = require('../middleware/validation');

router.post('/register', registerValidators, handleValidationErrors, authController.register);
router.post('/login', loginValidators, handleValidationErrors, authController.login);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
