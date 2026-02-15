/**
 * Doctor controller - CRUD, availability, appointments, reviews
 */

const db = require('../config/database');

/**
 * Get all verified doctors with optional filters
 */
const getDoctors = async (req, res, next) => {
  try {
    const { specialization, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT d.*, u.full_name, u.email, u.phone_number
      FROM doctors d
      JOIN users u ON d.id = u.id
      WHERE d.is_verified = true
    `;
    const params = [];
    let paramIndex = 1;

    if (specialization) {
      query += ` AND LOWER(d.specialization) = LOWER($${paramIndex})`;
      params.push(specialization);
      paramIndex++;
    }

    if (search) {
      query += ` AND (LOWER(u.full_name) LIKE $${paramIndex} OR LOWER(d.specialization) LIKE $${paramIndex})`;
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    query += ` ORDER BY d.rating DESC, d.total_reviews DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single doctor by ID
 */
const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT d.*, u.full_name, u.email, u.phone_number
       FROM doctors d
       JOIN users u ON d.id = u.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * Update doctor profile (doctor only)
 */
const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { specialization, license_number, years_of_experience, consultation_fee, bio } = req.body;

    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Cannot update another doctor\'s profile.' });
    }

    const result = await db.query(
      `UPDATE doctors
       SET specialization = COALESCE($2, specialization),
           license_number = COALESCE($3, license_number),
           years_of_experience = COALESCE($4, years_of_experience),
           consultation_fee = COALESCE($5, consultation_fee),
           bio = COALESCE($6, bio),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, specialization, license_number, years_of_experience, consultation_fee, bio]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * Set doctor availability schedule
 */
const setAvailability = async (req, res, next) => {
  const client = await db.pool.connect();

  try {
    const { availability } = req.body;
    const doctorId = req.user.role === 'admin' ? req.body.doctor_id || req.user.id : req.user.id;

    if (req.user.role !== 'admin' && req.user.id !== doctorId) {
      return res.status(403).json({ error: 'Cannot update another doctor\'s availability.' });
    }

    if (!Array.isArray(availability) || availability.length === 0) {
      return res.status(400).json({ error: 'Availability array required.' });
    }

    await client.query('BEGIN');

    await client.query('DELETE FROM doctor_availability WHERE doctor_id = $1', [doctorId]);

    for (const slot of availability) {
      if (slot.day_of_week && slot.start_time && slot.end_time) {
        await client.query(
          `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, is_available)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            doctorId,
            slot.day_of_week,
            slot.start_time,
            slot.end_time,
            slot.is_available !== false,
          ]
        );
      }
    }

    await client.query('COMMIT');

    const result = await db.query(
      'SELECT * FROM doctor_availability WHERE doctor_id = $1 ORDER BY day_of_week',
      [doctorId]
    );

    res.json(result.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Get doctor's availability
 */
const getAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM doctor_availability WHERE doctor_id = $1 AND is_available = true ORDER BY day_of_week',
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctor's appointments
 */
const getDoctorAppointments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, from_date, to_date } = req.query;

    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    let query = `
      SELECT a.*, u.full_name as patient_name, u.email as patient_email
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.id = u.id
      WHERE a.doctor_id = $1
    `;
    const params = [id];
    let paramIndex = 2;

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (from_date) {
      query += ` AND a.appointment_date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }
    if (to_date) {
      query += ` AND a.appointment_date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }

    query += ` ORDER BY a.appointment_date, a.appointment_time`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctor's reviews
 */
const getDoctorReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT r.*, u.full_name as patient_name
       FROM reviews r
       JOIN users u ON r.patient_id = u.id
       WHERE r.doctor_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, parseInt(limit), parseInt(offset)]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  updateDoctor,
  setAvailability,
  getAvailability,
  getDoctorAppointments,
  getDoctorReviews,
};
