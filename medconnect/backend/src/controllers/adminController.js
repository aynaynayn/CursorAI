/**
 * Admin controller - User management, doctor verification, statistics
 */

const db = require('../config/database');

/**
 * Get all users with filters
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT u.id, u.email, u.full_name, u.phone_number, u.role, u.created_at
      FROM users u
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (search) {
      query += ` AND (LOWER(u.full_name) LIKE $${paramIndex} OR LOWER(u.email) LIKE $${paramIndex})`;
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify/approve doctor
 */
const verifyDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE doctors SET is_verified = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
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
 * Unverify doctor
 */
const unverifyDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE doctors SET is_verified = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
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
 * Get platform statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const usersCount = await db.query(
      "SELECT role, COUNT(*) as count FROM users WHERE role != 'admin' GROUP BY role"
    );
    const totalAppointments = await db.query(
      'SELECT COUNT(*) as total FROM appointments'
    );
    const appointmentsByStatus = await db.query(
      'SELECT status, COUNT(*) as count FROM appointments GROUP BY status'
    );
    const completedAppointments = await db.query(
      "SELECT COUNT(*) as count FROM appointments WHERE status = 'completed'"
    );
    const cancelledAppointments = await db.query(
      "SELECT COUNT(*) as count FROM appointments WHERE status = 'cancelled'"
    );
    const verifiedDoctors = await db.query(
      "SELECT COUNT(*) as count FROM doctors WHERE is_verified = true"
    );
    const topSpecializations = await db.query(
      `SELECT d.specialization, COUNT(a.id) as bookings
       FROM doctors d
       LEFT JOIN appointments a ON d.id = a.doctor_id AND a.status != 'cancelled'
       WHERE d.is_verified = true
       GROUP BY d.specialization
       ORDER BY bookings DESC
       LIMIT 10`
    );

    const total = totalAppointments.rows[0].total;
    const completed = parseInt(completedAppointments.rows[0].count);
    const cancelled = parseInt(cancelledAppointments.rows[0].count);
    const cancellationRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : 0;

    res.json({
      users: Object.fromEntries(usersCount.rows.map(r => [r.role, parseInt(r.count)])),
      totalAppointments: parseInt(total),
      appointmentsByStatus: Object.fromEntries(appointmentsByStatus.rows.map(r => [r.status, parseInt(r.count)])),
      cancellationRate: parseFloat(cancellationRate),
      verifiedDoctors: parseInt(verifiedDoctors.rows[0].count),
      topSpecializations: topSpecializations.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all appointments (admin)
 */
const getAllAppointments = async (req, res, next) => {
  try {
    const { status, from_date, to_date, limit = 100 } = req.query;

    let query = `
      SELECT a.*, u_p.full_name as patient_name, u_d.full_name as doctor_name, d.specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u_p ON p.id = u_p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u_d ON d.id = u_d.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

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

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  verifyDoctor,
  unverifyDoctor,
  getStatistics,
  getAllAppointments,
};
