# Appointment Management System — MERN Stack

A role-based appointment management starter with three users:

- Admin
- Doctor
- Patient

## Included features

- JWT authentication and role authorization
- Doctor registration and admin approval
- Doctor profile and weekly schedule management
- Approved-doctor search
- Date-based available slot generation
- Patient appointment booking
- Doctor appointment confirmation, rejection, completion and no-show updates
- Patient cancellation
- Admin, doctor and patient dashboards
- MongoDB double-booking protection

## Requirements

- Node.js 18 or newer
- MongoDB running locally, or a MongoDB Atlas connection string

## 1. Configure the backend

Copy the example environment file:

```bash
cd server
cp .env.example .env
```

Update `MONGO_URI`, `JWT_SECRET`, and the seed-admin values.

## 2. Configure the frontend

```bash
cd client
cp .env.example .env
```

## 3. Install dependencies

From the project root:

```bash
npm run install:all
```

## 4. Create the first admin

```bash
npm run seed:admin
```

Default values come from `server/.env`.

## 5. Run the project

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API health: http://localhost:5000/api/health

## Typical workflow

1. Register a doctor account.
2. Login as admin and approve the doctor.
3. Login as doctor and create weekly schedules.
4. Register/login as patient.
5. Browse doctors, choose a date and available slot, then book.
6. Login as doctor and confirm or reject the request.

## Main API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/admin/dashboard`
- `GET /api/admin/doctors/pending`
- `PATCH /api/admin/doctors/:doctorId/approval`
- `GET /api/doctors`
- `GET /api/doctors/:doctorId/slots?date=YYYY-MM-DD`
- `GET /api/doctors/me/profile`
- `PUT /api/doctors/me/profile`
- `GET /api/doctors/me/schedules`
- `POST /api/doctors/me/schedules`
- `GET /api/appointments/mine`
- `POST /api/appointments`
- `PATCH /api/appointments/:appointmentId/status`
- `PATCH /api/appointments/:appointmentId/cancel`

## Security notes

- Public registration cannot create admin accounts.
- Passwords are hashed with bcrypt.
- Protected routes require a Bearer JWT.
- Role middleware protects admin, doctor, and patient endpoints.
- The appointment collection uses a unique active booking key to prevent double booking.
