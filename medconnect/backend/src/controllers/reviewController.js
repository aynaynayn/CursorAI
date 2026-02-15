/**
 * Review controller - Create and fetch reviews
 */

const db = require('../config/database');

/**
 * Create review for completed appointment
 */
const createReview = async (req, res, next) => {
  try {
    const { appointment_id, rating, comment } = req.body;
    const patientId = req.user.id;

    const apptResult = await db.query(
      'SELECT * FROM appointments WHERE id = $1 AND patient_id = $2 AND status = $3',
      [appointment_id, patientId, 'completed']
    );

    if (apptResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Can only review completed appointments that belong to you.',
      });
    }

    const existingReview = await db.query(
      'SELECT id FROM reviews WHERE appointment_id = $1',
      [appointment_id]
    );

    if (existingReview.rows.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this appointment.' });
    }

    const appointment = apptResult.rows[0];

    const result = await db.query(
      `INSERT INTO reviews (appointment_id, patient_id, doctor_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [appointment_id, patientId, appointment.doctor_id, rating, comment || null]
    );

    const review = result.rows[0];

    await db.query(
      `UPDATE doctors
       SET total_reviews = total_reviews + 1,
           rating = (
             SELECT ROUND(AVG(rating)::numeric, 2)
             FROM reviews
             WHERE doctor_id = $1
           )
       WHERE id = $1`,
      [appointment.doctor_id]
    );

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a doctor
 */
const getDoctorReviews = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT r.*, u.full_name as patient_name
       FROM reviews r
       JOIN users u ON r.patient_id = u.id
       WHERE r.doctor_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [doctorId, parseInt(limit), parseInt(offset)]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getDoctorReviews,
};
