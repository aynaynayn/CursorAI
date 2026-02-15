/**
 * Database seed script - Sample data for testing
 * Run: node database/seed.js
 * Requires schema to be initialized first
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');

const SALT_ROUNDS = 10;

async function upsertUserReturnId(client, { email, passwordHash, role, fullName, phoneNumber }) {
  const res = await client.query(
    `
    INSERT INTO users (email, password_hash, role, full_name, phone_number)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      full_name = EXCLUDED.full_name,
      phone_number = EXCLUDED.phone_number,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id
    `,
    [email, passwordHash, role, fullName, phoneNumber]
  );
  return res.rows[0].id;
}

async function seed() {
  const client = await pool.connect();

  try {
    const adminHash = await bcrypt.hash('admin123', SALT_ROUNDS);
    const userHash = await bcrypt.hash('password123', SALT_ROUNDS);

    await client.query('BEGIN');

    // Admin
    const adminId = await upsertUserReturnId(client, {
      email: 'admin@medconnect.com',
      passwordHash: adminHash,
      role: 'admin',
      fullName: 'Admin User',
      phoneNumber: '+1234567890',
    });

    // Doctors
    const doctorIds = [];
    const doctors = [
      { name: 'Dr. Sarah Johnson', spec: 'Cardiology', fee: 150, exp: 12 },
      { name: 'Dr. Michael Chen', spec: 'Dermatology', fee: 120, exp: 8 },
      { name: 'Dr. Emily Davis', spec: 'Pediatrics', fee: 100, exp: 10 },
      { name: 'Dr. James Wilson', spec: 'General Medicine', fee: 90, exp: 15 },
      { name: 'Dr. Lisa Martinez', spec: 'Orthopedics', fee: 180, exp: 6 },
    ];

    for (let i = 0; i < doctors.length; i++) {
      const d = doctors[i];

      const userId = await upsertUserReturnId(client, {
        email: `doctor${i + 1}@medconnect.com`,
        passwordHash: userHash,
        role: 'doctor',
        fullName: d.name,
        phoneNumber: '+1234567891',
      });

      doctorIds.push(userId);

      await client.query(
        `
        INSERT INTO doctors (
          id, specialization, license_number, years_of_experience,
          consultation_fee, bio, is_verified, rating, total_reviews
        )
        VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          specialization = EXCLUDED.specialization,
          license_number = EXCLUDED.license_number,
          years_of_experience = EXCLUDED.years_of_experience,
          consultation_fee = EXCLUDED.consultation_fee,
          bio = EXCLUDED.bio,
          is_verified = true,
          rating = EXCLUDED.rating,
          total_reviews = EXCLUDED.total_reviews,
          updated_at = CURRENT_TIMESTAMP
        `,
        [
          userId,
          d.spec,
          `LIC-${1000 + i}`,
          d.exp,
          d.fee,
          `Experienced ${d.spec} specialist.`,
          Number((4 + (i + 1) * 0.1).toFixed(2)), // e.g. 4.10, 4.20...
          10 + i,
        ]
      );

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      for (const day of days) {
        await client.query(
          `
          INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, is_available)
          VALUES ($1, $2, '09:00', '17:00', true)
          ON CONFLICT (doctor_id, day_of_week) DO UPDATE SET
            start_time = '09:00',
            end_time = '17:00',
            is_available = true,
            updated_at = CURRENT_TIMESTAMP
          `,
          [userId, day]
        );
      }
    }

    // Patients
    const patientIds = [];
    for (let i = 0; i < 10; i++) {
      const userId = await upsertUserReturnId(client, {
        email: `patient${i + 1}@medconnect.com`,
        passwordHash: userHash,
        role: 'patient',
        fullName: `Patient ${i + 1}`,
        phoneNumber: '+1234567892',
      });

      patientIds.push(userId);

      // Use safe DOB day (01..10)
      const day = String(i + 1).padStart(2, '0');

      await client.query(
        `
        INSERT INTO patients (id, date_of_birth, blood_type, allergies, medical_history)
        VALUES ($1, $2, 'O+', NULL, NULL)
        ON CONFLICT (id) DO UPDATE SET
          date_of_birth = EXCLUDED.date_of_birth,
          blood_type = EXCLUDED.blood_type,
          updated_at = CURRENT_TIMESTAMP
        `,
        [userId, `1990-01-${day}`]
      );
    }

    // Appointments for tomorrow (avoid duplicates via WHERE NOT EXISTS)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    await client.query(
      `
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, consultation_type, notes)
      SELECT $1, $2, $3, '10:00', 'confirmed', 'in-person', 'Initial consultation'
      WHERE NOT EXISTS (
        SELECT 1 FROM appointments
        WHERE doctor_id = $2
          AND appointment_date = $3
          AND appointment_time = '10:00'
          AND status <> 'cancelled'
      )
      `,
      [patientIds[0], doctorIds[0], dateStr]
    );

    await client.query(
      `
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, consultation_type, meeting_link)
      SELECT $1, $2, $3, '14:00', 'confirmed', 'video', 'https://meet.jit.si/medconnect-test1'
      WHERE NOT EXISTS (
        SELECT 1 FROM appointments
        WHERE doctor_id = $2
          AND appointment_date = $3
          AND appointment_time = '14:00'
          AND status <> 'cancelled'
      )
      `,
      [patientIds[1], doctorIds[1], dateStr]
    );

    await client.query('COMMIT');

    console.log('Seed data created successfully.');
    console.log('Admin: admin@medconnect.com / admin123');
    console.log('Doctors: doctor1@medconnect.com ... doctor5@medconnect.com / password123');
    console.log('Patients: patient1@medconnect.com ... patient10@medconnect.com / password123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
