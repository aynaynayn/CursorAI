/**
 * Email service - Send transactional emails
 * Falls back to console logging when email is not configured
 */

const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

/**
 * Send email helper
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    console.log('[Email] Not configured. Would send:', { to, subject, text: text?.substring(0, 50) });
    return { success: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'MedConnect <noreply@medconnect.com>',
      to,
      subject,
      text: text || html?.replace(/<[^>]*>/g, ''),
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false };
  }
};

const sendAppointmentReminder = async (appointment) => {
  return sendEmail({
    to: appointment.patient_email,
    subject: 'MedConnect - Appointment Reminder',
    text: `Hi ${appointment.patient_name}, your appointment is scheduled for ${appointment.appointment_date} at ${appointment.appointment_time}.`,
  });
};

const sendAppointmentConfirmation = async (appointment) => {
  return sendEmail({
    to: appointment.patient_email,
    subject: 'MedConnect - Appointment Confirmed',
    text: `Hi ${appointment.patient_name}, your appointment has been confirmed for ${appointment.appointment_date} at ${appointment.appointment_time}.`,
  });
};

const sendAppointmentCancelled = async (appointment) => {
  return sendEmail({
    to: appointment.patient_email,
    subject: 'MedConnect - Appointment Cancelled',
    text: `Hi ${appointment.patient_name}, your appointment for ${appointment.appointment_date} has been cancelled.`,
  });
};

module.exports = {
  sendEmail,
  sendAppointmentReminder,
  sendAppointmentConfirmation,
  sendAppointmentCancelled,
};
