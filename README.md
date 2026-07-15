# Smart Attendance System (SmartAttend)

SmartAttend is a secure, light-weight college attendance system designed to prevent proxy attendance using dynamic rotating QR codes and hardware-based trusted device verification. It does not rely on AI, facial recognition, or GPU-heavy frameworks, making it extremely fast, cost-efficient, and suitable for free hosting tiers.

---

## Folder Structure

```
smart-ai-attendance-system/
├── package.json              # Root package.json for concurrent orchestration
├── README.md                 # Complete system documentation and setup guide
├── backend/                  # Node.js + Express API Server
│   ├── config/               # Database config
│   │   └── db.js             # Mongoose connection
│   ├── controllers/          # Business logic (Auth, Attendance, Devices, etc.)
│   ├── middleware/           # Protected route filters & error handlers
│   ├── models/               # MongoDB Schemas
│   ├── routes/               # API endpoints
│   ├── utils/                # PDF and Excel report builders
│   ├── .env                  # Configuration variables template
│   └── server.js             # Server entry point
└── client/                   # Vite + React.js + Tailwind CSS Frontend
    ├── public/               # Static assets
    ├── src/
    │   ├── assets/           # Client media
    │   ├── components/       # Reusable layout blocks (Navbar, Sidebar, etc.)
    │   ├── context/          # Global Auth & State managers
    │   ├── pages/            # View components (Dashboards, Scanners, history)
    │   ├── App.jsx           # Client router
    │   ├── main.jsx          # Entry point
    │   └── index.css         # Tailwind & custom glassmorphism styles
    ├── tailwind.config.js    # Tailwind configuration
    ├── postcss.config.js     # PostCSS setup
    └── vite.config.js        # Vite build properties
```

---

## Technology Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Framer Motion, React Hot Toast, React Icons, `html5-qrcode` (Scanner)
- **Backend**: Node.js, Express.js, JWT, `bcryptjs`
- **Database**: MongoDB (Mongoose ODM)
- **Reports**: `exceljs` (Excel generation), `pdfkit` (PDF generation)
- **QR Code Generation**: `qrcode`

---

## Security System Architecture

### 1. Trusted Device Lock (Proxy Prevention)
1. **First-time Login**: The system generates a cryptographically secure UUID, registers it in the student's database record, sets `deviceApproved = true`, and returns it to the client. The client saves it in the browser's Local Storage (`trusted_device_token`).
2. **Subsequent Logins**: The client sends the local storage UUID along with credentials. If a mismatch is detected (different browser, cleared cookies, or different physical phone), the server marks the device as unapproved (`deviceApproved = false`).
3. **Attendance Block**: Marking attendance is completely blocked for unapproved devices.
4. **Teacher Reset Approval**: The student submits a "Device Change Request". The teacher/admin reviews the pending request. Once approved, the database updates the registered UUID to the student's new device token, unlocking attendance.

### 2. Dynamic QR Rotation
- Attendance QR codes contain a signed combination of the session ID and a unique `qrToken`.
- The teacher's active board automatically rotates this token every 30 seconds via a backend call.
- If a student scans an outdated code (e.g. shared via screenshot), the server rejects the request with "Invalid or expired QR Code".

---

## Local Setup & Quick Start

### Prerequisites
- Node.js installed (v18+ recommended)
- Local MongoDB running, or a MongoDB Atlas connection string

### Steps

1. **Clone the repository and go to the root folder**
   ```bash
   cd smart-ai-attendance-system
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the `backend/` folder:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/smart_attendance
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

3. **Install Dependencies**
   Run the following in the root directory to install orchestration libraries and packages:
   ```bash
   npm install
   npm run install-all
   ```

4. **Start the Development Servers**
   To run both the backend API and the React client concurrently from a single terminal:
   ```bash
   npm run dev
   ```
   - **Backend API**: `http://localhost:5000`
   - **React Client**: `http://localhost:5173`

---

## API Documentation

### 1. Authentication (`/api/auth`)
- **POST** `/register-student`: Registers a new student account.
  - Body: `{ name, registerNumber, email, password, department, year }`
- **POST** `/register-teacher`: Registers a new teacher/admin.
  - Body: `{ name, email, password, department, adminSecret }` (Pass `AdminSuperSecret123` as `adminSecret` to register as Admin)
- **POST** `/login`: Handles student, teacher, or admin login.
  - Body: `{ email, password, clientDeviceToken }`
- **GET** `/me`: Fetches current logged-in profile. Requires JWT Header.

### 2. Subjects (`/api/subjects`)
- **POST** `/`: Creates a subject. Requires Teacher/Admin JWT.
  - Body: `{ name, code, teacherId }`
- **GET** `/`: Fetches subjects (filtered to teacher's subjects, or all for admin).

### 3. Attendance Session & Marks (`/api/attendance`)
- **POST** `/session/start`: Initiates a check-in window. Requires Teacher JWT.
  - Body: `{ subjectId, durationMinutes }`
- **POST** `/session/:id/rotate`: Updates session QR token. Requires Teacher JWT.
- **POST** `/session/:id/end`: Closes check-in window. Requires Teacher JWT.
- **GET** `/session/:id/live`: Polls active check-ins. Requires Teacher JWT.
- **POST** `/mark`: Validates QR token and marks student present. Requires Student JWT.
  - Body: `{ sessionId, qrToken, clientDeviceToken }`
- **GET** `/history/student`: Fetches student's attendance list. Requires Student JWT.
- **GET** `/history`: Query historical records. Requires Teacher/Admin JWT.
- **POST** `/manual`: Override/Mark student attendance manually. Requires Teacher JWT.
  - Body: `{ studentId, sessionId, status }` (status: `'Present'` / `'Absent'`)
- **GET** `/analytics`: Retrieves stats for dashboard charts. Requires Teacher/Admin JWT.

### 4. Report Exports
- **GET** `/api/attendance/export/excel?subjectId=<id>`: Generates a styled Excel sheet with zebra-stripes and automatic column resizing.
- **GET** `/api/attendance/export/pdf?subjectId=<id>`: Generates a styled PDF report.

### 5. Device Requests (`/api/device-requests`)
- **POST** `/`: Student files a link request. Requires Student JWT.
  - Body: `{ newToken }`
- **GET** `/my-pending`: Fetches student's pending request status. Requires Student JWT.
- **GET** `/`: Lists pending device change requests. Requires Teacher/Admin JWT.
- **PUT** `/:id`: Approves or Rejects a change request. Requires Teacher/Admin JWT.
  - Body: `{ status }` (status: `'Approved'` / `'Rejected'`)

---

## Deployment Guide

### Database (MongoDB Atlas)
1. Sign up/Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Free Shared Cluster.
3. Add a database user with password auth.
4. Allow access from anywhere (`0.0.0.0/0`) in Network Access settings.
5. Copy the connection string and paste it as `MONGO_URI` in your backend environment configuration.

### Backend (Render)
1. Register on [Render](https://render.com).
2. Connect your Git repository.
3. Click "New" > "Web Service".
4. Set root directory to `backend`.
5. Build Command: `npm install`
6. Start Command: `node server.js`
7. Add your Environment Variables under the "Environment" tab (`MONGO_URI`, `JWT_SECRET`, etc.).

### Frontend (Vercel)
1. Log in to [Vercel](https://vercel.com).
2. Click "Add New" > "Project".
3. Select your repository.
4. Configure Project settings:
   - Framework Preset: `Vite`
   - Root Directory: `client`
5. Click "Deploy".
