# Smart Attendance System with Trusted Device Verification

A secure, lightweight, and production-quality Smart Attendance System designed for academic institutions to eliminate proxy attendance. The system does not use AI, facial recognition, or fingerprint sensors; instead, it enforces strict cryptographic trusted device binding, dynamic rolling QR code tokens, and time-window validation.

---

## Key Features

- **Trusted Device binding**: Students are bound to a unique browser token (UUID) upon their first login. Logins from unapproved devices trigger a lockout, requiring professor or administrator approval before attendance can be marked.
- **Dynamic QR Code attendance**: QR codes rotate every 30 seconds. QR tokens are verified on the backend for validation of active session states, preventing screenshot sharing and remote scanning.
- **Multi-Role Dashboards**:
  - **Students**: Scan QR codes, request browser migrations, view current attendance rate and logs.
  - **Teachers**: Manage classrooms, start live attendance sessions, approve/reject device transfer requests, track attendees in real-time, and download spreadsheets.
  - **Administrators**: Full CRUD control over student registries, teachers, and subjects, along with central system analytics.
- **Modern UI**: Dark/light aesthetics, glassmorphism cards, interactive tables, charts, progress status, and toast notifications.

---

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Axios, React Hot Toast, `html5-qrcode` (webcam QR scanner), `qrcode` (QR generator).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose schemas).
- **Security**: JWT tokens, Bcrypt password hashing, Helmet headers, CORS policies, rate limiting, and inputs validation.

---

## Folder Structure

```
smart-ai-attendance/
├── client/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── context/          # AuthContext managing user roles & device IDs
│   │   ├── pages/            # Student, Teacher, Admin Dashboards & Auth pages
│   │   └── services/         # Axios api instance with automatic header/device injection
│   └── tailwind.config.js
├── backend/
│   ├── config/               # Database connection
│   ├── controllers/          # Business logic for auth, attendance, devices, and admin CRUD
│   ├── models/               # Mongoose schemas
│   └── routes/               # Express routing
└── package.json
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas connection string.

### Quick Setup (Root Folder)

1. Clone or download this project workspace.
2. Install all root, client, and server dependencies:
   ```bash
   npm run install:all
   ```
3. Set up the environment variables in `backend/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smart_attendance
   JWT_SECRET=your_secret_jwt_key
   ADMIN_EMAIL=admin@college.edu
   ADMIN_PASSWORD=admin123
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

4. Run the development environment:
   ```bash
   npm run dev
   ```
   This will concurrently boot up:
   - **Frontend client**: [http://localhost:5173](http://localhost:5173)
   - **Backend API server**: [http://localhost:5000](http://localhost:5000)

---

## Default Seeding

The application initializes with a pre-seeded Administrator account:
- **Email**: `admin@college.edu`
- **Password**: `admin123`

You can use the administrator dashboard to create teachers, students, and curriculum subjects to test the live workspace flow.

---

## Trusted Device Logic

1. **First Login**: When a student logs in for the first time, a random UUID is created on the server and returned to the browser. The browser stores it in `localStorage` under `trustedDeviceToken`. The backend saves this token as the student's primary device.
2. **Subsequent Logins / Attendance Marks**: All attendance submissions check if the current browser's token matches the database token.
3. **Migrating Devices**: If a student accesses the system from a new browser/device, a mismatch is detected. The student is locked out of attendance, and they must click **Request Device Change** on the dashboard. This submits a pending approval to the teacher panel. Once approved, the database updates the student's trusted token to the new device.
