/**
 * Authentication controller - Register, Login, Logout
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 10;
const JWT_EXPIRES = '7d';

/**
 * Register new user (patient or doctor)
 */
const register = async (req, res, next) => {
  const client = await db.pool.connect();
  
  try {
    const { email, password, full_name, role, phone_number } = req.body;

    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = uuidv4();

    await client.query('BEGIN');

    await client.query(
      `INSERT INTO users (id, email, password_hash, role, full_name, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, email, passwordHash, role, full_name, phone_number || null]
    );

    if (role === 'doctor') {
      const { specialization, license_number, years_of_experience, consultation_fee, bio } = req.body;
      await client.query(
        `INSERT INTO doctors (id, specialization, license_number, years_of_experience, consultation_fee, bio, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, false)`,
        [
          userId,
          specialization || 'General',
          license_number || null,
          years_of_experience || 0,
          consultation_fee || 0,
          bio || null,
        ]
      );
    } else {
      const { date_of_birth, blood_type, allergies, medical_history } = req.body;
      await client.query(
        `INSERT INTO patients (id, date_of_birth, blood_type, allergies, medical_history)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          date_of_birth || null,
          blood_type || null,
          allergies || null,
          medical_history || null,
        ]
      );
    }

    await client.query('COMMIT');

    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: JWT_EXPIRES }
    );

    const userResult = await client.query(
      'SELECT id, email, full_name, phone_number, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: userResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      'SELECT id, email, password_hash, full_name, phone_number, role, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: JWT_EXPIRES }
    );

    delete user.password_hash;

    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userResult = await db.query(
      'SELECT id, email, full_name, phone_number, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userResult.rows[0];

    if (user.role === 'doctor') {
      const doctorResult = await db.query(
        'SELECT * FROM doctors WHERE id = $1',
        [userId]
      );
      return res.json({ ...user, doctor: doctorResult.rows[0] });
    }

    if (user.role === 'patient') {
      const patientResult = await db.query(
        'SELECT * FROM patients WHERE id = $1',
        [userId]
      );
      return res.json({ ...user, patient: patientResult.rows[0] });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
