# Academic Management System (AMS)

A full-stack Academic Management System for universities: attendance tracking, timetable management, face-recognition attendance, leave requests, dispute resolution, and role-based portals for Admin, Faculty, and Students.

## 🌐 Live Demo

- **Production:** [https://ams-academic-management-system.vercel.app](https://ams-academic-management-system.vercel.app)

## 🚀 Features

### Core Functionality
- **Role-Based Access Control**: Separate, permission-scoped portals for Admin, Faculty, and Students.
- **Attendance Management**: Real-time attendance marking and per-student tracking.
- **Face Recognition Attendance**: In-browser face detection and 128-d embedding matching (`@vladmandic/face-api`) marks students present automatically, with an on-camera overlay and a live "recognised" feed.
- **Face Enrolment**: Faculty enrol a student's face once; embeddings are stored and matched during scanning.
- **Timetable Setup**: Conflict-free room and schedule management.
- **Leave Applications**: Students apply for leave; faculty approve or reject.
- **Dispute Resolution**: Dedicated inbox for faculty to resolve student attendance disputes.
- **Bulk Import / Export**: CSV and Excel import of students and attendance data.

### User Experience
- **Dynamic Dark Mode**: Context-aware theming across environments.
- **Modern UI**: React and Tailwind CSS with glassmorphism and subtle micro-animations.
- **Real-time Feedback**: Toasts and audible confirmation on successful face recognition.

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router, Lucide Icons.
- **Face Recognition**: `@vladmandic/face-api` (TinyFaceDetector, 68-point landmarks, 128-d descriptors) running entirely client-side.
- **Backend**: Node.js, Express, PostgreSQL (`pg`), Multer uploads, Helmet, rate limiting.
- **Authentication**: JWT access/refresh tokens with bcrypt password hashing.

## 📦 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v15+)

### Local Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/palturuvenubhaskar/AMS.git
   cd AMS
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env` in the repository root and update the values (database URL, JWT secrets, CORS origin).

3. **Create and migrate the database**

   ```bash
   cd backend
   npm install
   npm run migrate
   npm run seed
   ```

4. **Start the backend**

   ```bash
   cd backend
   npm run dev
   ```

   The API listens on `http://localhost:5000` by default.

5. **Start the frontend**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   The app is served at `http://localhost:5173`.

> Camera access requires a secure context: use `http://localhost` or HTTPS. Browsers block `getUserMedia` on plain HTTP over a LAN IP.

## 🧪 Testing

The backend includes a Jest + Supertest suite:

```bash
cd backend
npm test
```

The frontend can be linted and built with:

```bash
cd frontend
npm run lint
npm run build
```

## 📄 License

Released under the [MIT License](LICENSE).
