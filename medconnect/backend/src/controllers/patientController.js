/**
 * Patient controller - Profile and appointments
 */

const db = require('../config/database');

/**
 * Get patient by ID
 */
const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const userResult = await db.query(
      'SELECT id, email, full_name, phone_number, role, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const patientResult = await db.query(
      'SELECT * FROM patients WHERE id = $1',
      [id]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    res.json({
      ...userResult.rows[0],
      patient: patientResult.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update patient profile
 */
const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, phone_number, date_of_birth, blood_type, allergies, medical_history } = req.body;

    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      if (full_name !== undefined || phone_number !== undefined) {
        await client.query(
          `UPDATE users SET full_name = COALESCE($2, full_name), phone_number = COALESCE($3, phone_number), updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [id, full_name, phone_number]
        );
      }

      await client.query(
        `UPDATE patients
         SET date_of_birth = COALESCE($2, date_of_birth),
             blood_type = COALESCE($3, blood_type),
             allergies = COALESCE($4, allergies),
             medical_history = COALESCE($5, medical_history),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id, date_of_birth, blood_type, allergies, medical_history]
      );

      await client.query('COMMIT');

      const result = await db.query(
        `SELECT u.id, u.email, u.full_name, u.phone_number, u.role, p.*
         FROM users u
         JOIN patients p ON u.id = p.id
         WHERE u.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Patient not found.' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient's appointments
 */
const getPatientAppointments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    let query = `
      SELECT a.*, d.specialization, d.consultation_fee, u.full_name as doctor_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.id = u.id
      WHERE a.patient_id = $1
    `;
    const params = [id];

    if (status) {
      query += ' AND a.status = $2';
      params.push(status);
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatientById,
  updatePatient,
  getPatientAppointments,
};
