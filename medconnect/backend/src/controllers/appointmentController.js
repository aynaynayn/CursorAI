/**
 * Appointment controller - Create, update, cancel, available slots
 */

const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const notificationService = require('../services/notificationService');

/**
 * Get available time slots for a doctor on a given date
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.params;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const apptDate = new Date(date);
    const dayOfWeek = dayNames[apptDate.getDay()];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (apptDate < today) {
      return res.json([]);
    }

    const availabilityResult = await db.query(
      'SELECT * FROM doctor_availability WHERE doctor_id = $1 AND day_of_week = $2 AND is_available = true',
      [doctorId, dayOfWeek]
    );

    if (availabilityResult.rows.length === 0) {
      return res.json([]);
    }

    const bookedResult = await db.query(
      `SELECT appointment_time, duration_minutes FROM appointments
       WHERE doctor_id = $1 AND appointment_date = $2 AND status NOT IN ('cancelled')`,
      [doctorId, date]
    );

    const bookedSlots = new Set();
    bookedResult.rows.forEach(row => {
      const start = row.appointment_time;
      const duration = row.duration_minutes || 30;
      const [h, m] = start.split(':').map(Number);
      for (let i = 0; i < duration; i += 30) {
        const mins = m + i;
        const hrs = h + Math.floor(mins / 60);
        const slot = `${String(hrs).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
        bookedSlots.add(slot);
      }
    });

    const slots = [];
    for (const avail of availabilityResult.rows) {
      const [startH, startM] = avail.start_time.split(':').map(Number);
      const [endH, endM] = avail.end_time.split(':').map(Number);
      let currentMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;

      const isToday = apptDate.getTime() === today.getTime();
      const nowMins = new Date().getHours() * 60 + new Date().getMinutes() + 30;

      while (currentMins + 30 <= endMins) {
        const slotTime = `${String(Math.floor(currentMins / 60)).padStart(2, '0')}:${String(currentMins % 60).padStart(2, '0')}`;

        if (!bookedSlots.has(slotTime)) {
          if (!isToday || currentMins >= nowMins) {
            slots.push(slotTime);
          }
        }
        currentMins += 30;
      }
    }

    res.json(slots.sort());
  } catch (error) {
    next(error);
  }
};

/**
 * Create new appointment
 */
const createAppointment = async (req, res, next) => {
  try {
    const { doctor_id, appointment_date, appointment_time, consultation_type, notes } = req.body;
    let patientId = req.user.role === 'patient' ? req.user.id : req.body.patient_id;

    if (req.user.role === 'admin' && req.body.patient_id) {
      patientId = req.body.patient_id;
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID required.' });
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[new Date(appointment_date).getDay()];

    const availCheck = await db.query(
      `SELECT 1 FROM doctor_availability
       WHERE doctor_id = $1 AND day_of_week = $2 AND is_available = true
       AND start_time <= $3 AND end_time >= $3`,
      [doctor_id, dayOfWeek, appointment_time]
    );

    if (availCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Doctor is not available at this time.' });
    }

    const conflictCheck = await db.query(
      `SELECT id FROM appointments
       WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3
       AND status NOT IN ('cancelled')`,
      [doctor_id, appointment_date, appointment_time]
    );

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({ error: 'This time slot is no longer available.' });
    }

    const appointmentDate = new Date(appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDate < today) {
      return res.status(400).json({ error: 'Cannot book appointments in the past.' });
    }

    const meetingLink = consultation_type === 'video'
      ? `https://meet.jit.si/medconnect-${uuidv4().slice(0, 8)}`
      : null;

    const result = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, consultation_type, meeting_link, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [patientId, doctor_id, appointment_date, appointment_time, consultation_type || 'in-person', meetingLink, notes || null]
    );

    const appointment = result.rows[0];

    await notificationService.create({
      userId: doctor_id,
      type: 'appointment_confirmed',
      title: 'New Appointment Request',
      message: `New appointment request for ${appointment_date} at ${appointment_time}`,
      referenceId: appointment.id,
    });

    await notificationService.create({
      userId: patientId,
      type: 'appointment_confirmed',
      title: 'Appointment Requested',
      message: `Your appointment has been requested. Waiting for doctor confirmation.`,
      referenceId: appointment.id,
    });

    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
};

/**
 * Get appointment by ID
 */
const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT a.*,
              u_p.full_name as patient_name, u_p.email as patient_email,
              u_d.full_name as doctor_name, u_d.email as doctor_email,
              d.specialization, d.consultation_fee
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users u_p ON p.id = u_p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u_d ON d.id = u_d.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const appointment = result.rows[0];

    if (req.user.role === 'patient' && appointment.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (req.user.role === 'doctor' && appointment.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

/**
 * Update appointment (confirm, etc.)
 */
const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const appointment = existing.rows[0];

    if (req.user.role === 'doctor' && appointment.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (req.user.role === 'admin' && !status) {
      return res.status(400).json({ error: 'Status required.' });
    }

    if (status === 'confirmed' && req.user.role === 'doctor') {
      const result = await db.query(
        `UPDATE appointments SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id]
      );

      await notificationService.create({
        userId: appointment.patient_id,
        type: 'doctor_accepted',
        title: 'Appointment Confirmed',
        message: 'Your doctor has confirmed your appointment.',
        referenceId: id,
      });

      return res.json(result.rows[0]);
    }

    if (status === 'rejected' && req.user.role === 'doctor') {
      const result = await db.query(
        `UPDATE appointments SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id]
      );

      await notificationService.create({
        userId: appointment.patient_id,
        type: 'doctor_rejected',
        title: 'Appointment Declined',
        message: 'Your doctor has declined the appointment request.',
        referenceId: id,
      });

      return res.json(result.rows[0]);
    }

    res.status(400).json({ error: 'Invalid update.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel appointment
 */
const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const appointment = existing.rows[0];
    const isPatient = req.user.role === 'patient' && appointment.patient_id === req.user.id;
    const isDoctor = req.user.role === 'doctor' && appointment.doctor_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ error: 'Cannot cancel this appointment.' });
    }

    if (isPatient) {
      const apptDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
      const hoursUntil = (apptDateTime - new Date()) / (1000 * 60 * 60);
      if (hoursUntil < 24) {
        return res.status(400).json({ error: 'Cancellations require at least 24 hours notice.' });
      }
    }

    const result = await db.query(
      `UPDATE appointments SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    const notifyUserId = isPatient ? appointment.doctor_id : appointment.patient_id;
    await notificationService.create({
      userId: notifyUserId,
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: 'An appointment has been cancelled.',
      referenceId: id,
    });

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark appointment as completed
 */
const completeAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const appointment = existing.rows[0];

    if (req.user.role !== 'doctor' || appointment.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the doctor can mark as completed.' });
    }

    const result = await db.query(
      `UPDATE appointments SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * Add prescription to appointment
 */
const addPrescription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prescription } = req.body;

    const existing = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const appointment = existing.rows[0];

    if (req.user.role !== 'doctor' || appointment.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the doctor can add prescriptions.' });
    }

    const result = await db.query(
      `UPDATE appointments SET prescription = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, prescription]
    );

    await notificationService.create({
      userId: appointment.patient_id,
      type: 'general',
      title: 'Prescription Added',
      message: 'Your doctor has added a prescription to your appointment.',
      referenceId: id,
    });

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableSlots,
  createAppointment,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
  addPrescription,
};
