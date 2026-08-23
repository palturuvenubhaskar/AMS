# Academic Management System (AMS)

A modern, full-stack Academic Management System designed to streamline university operations including attendance tracking, timetable management, leave requests, and dispute resolutions.

## 🚀 Features

### Core Functionality
- **Role-Based Access Control**: Secure portals for Admin, Faculty, and Students.
- **Attendance Management**: Real-time attendance marking and tracking.
- **Timetable Setup**: Conflict-free room and schedule management.
- **Leave Applications**: Students can apply for leave; faculty can approve/reject.
- **Dispute Resolution**: Dedicated inbox for faculty to resolve student attendance disputes.

### User Experience
- **Dynamic Dark Mode**: Context-aware theming for a seamless viewing experience across environments.
- **Modern UI**: Built with React and Tailwind CSS, featuring glassmorphism and subtle micro-animations.
- **Real-time Updates**: Real-time notifications for critical updates using Socket.io.

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router, Lucide Icons.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL (relational data), Redis (caching).
- **Authentication**: JWT-based secure authentication with bcrypt password hashing.
- **Containerization**: Docker & Docker Compose for streamlined deployment.

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v15+)
- Redis
- *Alternatively, use Docker for one-click setup.*

### Quick Start with Docker
The easiest way to get the database running is via Docker Compose:
\`\`\`bash
docker-compose up -d
\`\`\`
*This provisions the PostgreSQL and Redis containers, and automatically runs the database schema and seed scripts.*

### Local Development Setup

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/palturuvenubhaskar/AMS.git
   cd AMS
   \`\`\`

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env` in the root directory.
   - Update the database credentials if running manually.

3. **Backend Setup**
   \`\`\`bash
   cd backend
   npm install
   npm run dev
   \`\`\`

4. **Frontend Setup**
   \`\`\`bash
   cd frontend
   npm install
   npm run dev
   \`\`\`

## 🧪 Testing

The backend includes a comprehensive Jest test suite ensuring data integrity and correct business logic.
\`\`\`bash
cd backend
npm test
\`\`\`
