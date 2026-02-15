/**
 * Notification service - Create and send notifications
 */

const db = require('../config/database');
const emailService = require('./emailService');

/**
 * Create in-app notification
 */
const create = async ({ userId, type, title, message, referenceId = null }) => {
  try {
    const result = await db.query(
      `INSERT INTO notifications (user_id, type, title, message, reference_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, message, referenceId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

/**
 * Send appointment reminder (called by scheduler/cron - placeholder)
 */
const sendAppointmentReminder = async (appointmentId) => {
  try {
    const result = await db.query(
      `SELECT a.*, u_p.email as patient_email, u_p.full_name as patient_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users u_p ON p.id = u_p.id
       WHERE a.id = $1 AND a.status IN ('confirmed', 'pending')`,
      [appointmentId]
    );

    if (result.rows.length === 0) return;

    const appointment = result.rows[0];

    await create({
      userId: appointment.patient_id,
      type: 'appointment_reminder',
      title: 'Appointment Reminder',
      message: `Reminder: Your appointment is tomorrow at ${appointment.appointment_time}`,
      referenceId: appointmentId,
    });

    await emailService.sendAppointmentReminder(appointment);
  } catch (error) {
    console.error('Failed to send reminder:', error);
  }
};

module.exports = {
  create,
  sendAppointmentReminder,
};
