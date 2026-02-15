# MedConnect - Healthcare Appointment & Consultation Platform

A full-stack Patient Appointment & Telemedicine Platform for small healthcare clinics and solo practitioners. Built with React, Node.js, Express, and PostgreSQL.

## Features

- **User Authentication**: JWT-based auth for Patients, Doctors, and Admins
- **Doctor Dashboard**: Manage availability, view appointments, accept/reject requests, add prescriptions
- **Patient Dashboard**: Search doctors, book appointments, view history, rate doctors
- **Appointment System**: Real-time slot checking, conflict prevention, 24-hour cancellation policy
- **Telemedicine**: Video consultation links (Jitsi Meet integration)
- **Notifications**: In-app notifications for confirmations, reminders, cancellations
- **Admin Panel**: User management, doctor verification, platform statistics
- **Reviews**: Patients can rate and review doctors after completed appointments

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Auth**: JWT (jsonwebtoken), bcrypt
- **Email**: Nodemailer (optional)

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Setup

### 1. Clone and install dependencies

```bash
cd medconnect
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Create PostgreSQL database

```bash
psql -U postgres -c "CREATE DATABASE medconnect;"
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values:
# DATABASE_URL=postgresql://username:password@localhost:5432/medconnect
# JWT_SECRET=your-secure-secret-min-32-chars
# PORT=5000
```

### 4. Initialize database schema

```bash
cd backend
node database/init.js
```

Or run the schema manually:

```bash
psql -U postgres -d medconnect -f database/schema.sql
```

### 5. Seed sample data

```bash
node database/seed.js
```

This creates:
- **Admin**: admin@medconnect.com / admin123
- **Doctors**: doctor1@medconnect.com ... doctor5@medconnect.com / password123
- **Patients**: patient1@medconnect.com ... patient10@medconnect.com / password123

### 6. Run the application

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) |
| `PORT` | Backend port (default 5000) |
| `NODE_ENV` | development / production |
| `FRONTEND_URL` | Frontend URL for CORS |
| `EMAIL_USER` | (Optional) Email for notifications |
| `EMAIL_PASSWORD` | (Optional) Email app password |
| `EMAIL_FROM` | (Optional) From address |

## API Endpoints

### Auth
- `POST /api/auth/register` - Register (patient/doctor)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user (requires auth)

### Doctors
- `GET /api/doctors` - List verified doctors (query: search, specialization)
- `GET /api/doctors/:id` - Doctor details
- `GET /api/doctors/:id/availability` - Doctor availability
- `GET /api/doctors/:id/appointments` - Doctor appointments (auth)
- `PUT /api/doctors/:id` - Update profile (doctor/admin)
- `POST /api/doctors/availability` - Set availability (doctor)

### Patients
- `GET /api/patients/:id` - Patient details (auth)
- `PUT /api/patients/:id` - Update profile (auth)
- `GET /api/patients/:id/appointments` - Patient appointments (auth)

### Appointments
- `GET /api/appointments/available-slots/:doctorId/:date` - Available slots
- `POST /api/appointments` - Create (patient, auth)
- `GET /api/appointments/:id` - Details (auth)
- `PUT /api/appointments/:id` - Update/confirm (auth)
- `DELETE /api/appointments/:id` - Cancel (auth)
- `POST /api/appointments/:id/complete` - Mark completed (doctor)
- `POST /api/appointments/:id/prescription` - Add prescription (doctor)

### Reviews
- `POST /api/reviews` - Create review (patient)
- `GET /api/reviews/doctor/:doctorId` - Doctor reviews

### Notifications
- `GET /api/notifications` - User notifications (auth)
- `PUT /api/notifications/:id/read` - Mark read (auth)

### Admin
- `GET /api/admin/users` - List users
- `GET /api/admin/statistics` - Platform stats
- `GET /api/admin/appointments` - All appointments
- `PUT /api/admin/doctors/:id/verify` - Verify doctor

## Deployment

### Backend (Railway, Render, AWS)

1. Set `NODE_ENV=production`
2. Set `DATABASE_URL` to your PostgreSQL URL
3. Set a strong `JWT_SECRET`
4. Configure CORS with your frontend URL in `FRONTEND_URL`
5. Run `node database/init.js` and `node database/seed.js` for initial setup

### Frontend (Vite)

1. Set `VITE_API_URL` to your backend URL (or use proxy)
2. Build: `npm run build`
3. Deploy `dist/` to Vercel, Netlify, or any static host

### Database migrations

For production, use a migration tool (e.g. node-pg-migrate) instead of running schema.sql directly. The schema is idempotent where possible.

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT for session management
- Rate limiting on API
- Helmet for security headers
- Input validation with express-validator
- Prepared statements (parameterized queries) for SQL

## License

MIT
