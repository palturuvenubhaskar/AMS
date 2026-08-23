import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Pages
import Login from './pages/Login';

// Admin
import AdminLayout from './components/layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import Departments from './pages/admin/Departments';
import AdminClasses from './pages/admin/Classes';
import Subjects from './pages/admin/Subjects';
import SubjectMapping from './pages/admin/SubjectMapping';
import TimetableSetup from './pages/admin/TimetableSetup';
import Users from './pages/admin/Users';

// Faculty
import FacultyLayout from './components/layouts/FacultyLayout';
import FacultyDashboard from './pages/faculty/Dashboard';
import TakeAttendance from './pages/faculty/TakeAttendance';
import AttendanceHistory from './pages/faculty/AttendanceHistory';
import FacultyTimetable from './pages/faculty/Timetable';
import FacultyClasses from './pages/faculty/Classes';
import LeaveInbox from './pages/faculty/LeaveInbox';
import DisputesInbox from './pages/faculty/DisputesInbox';

// Student
import StudentLayout from './components/layouts/StudentLayout';
import MyAttendance from './pages/student/MyAttendance';
import StudentTimetable from './pages/student/Timetable';
import ApplyLeave from './pages/student/ApplyLeave';
import LeaveHistory from './pages/student/LeaveHistory';
import Profile from './pages/student/Profile';
import Projections from './pages/student/Projections';

// Parent
import ParentLayout from './components/layouts/ParentLayout';
import ParentDashboard from './pages/parent/Dashboard';

// Protected Route — redirects to /login if not authenticated
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's own dashboard
    const roleRoutes = { admin: '/admin', faculty: '/faculty', student: '/student', parent: '/parent' };
    return <Navigate to={roleRoutes[user.role] || '/login'} replace />;
  }

  return children;
}

// Redirect authenticated users to their role-based dashboard
function RoleRedirect() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roleRoutes = { admin: '/admin', faculty: '/faculty', student: '/student', parent: '/parent' };
  return <Navigate to={roleRoutes[user.role] || '/login'} replace />;
}

// Redirect already-authenticated users away from /login
function PublicRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  if (isAuthenticated) {
    const roleRoutes = { admin: '/admin', faculty: '/faculty', student: '/student', parent: '/parent' };
    return <Navigate to={roleRoutes[user.role] || '/'} replace />;
  }

  return children;
}

import { SocketProvider } from './contexts/SocketContext';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                },
              }}
            />

            <Routes>
              {/* Public */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

              {/* Root - redirect based on role */}
              <Route path="/" element={<RoleRedirect />} />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="departments" element={<Departments />} />
                <Route path="classes" element={<AdminClasses />} />
                <Route path="subjects" element={<Subjects />} />
                <Route path="subject-mapping" element={<SubjectMapping />} />
                <Route path="timetable-setup" element={<TimetableSetup />} />
                <Route path="users" element={<Users />} />
              </Route>

              {/* Faculty Routes */}
              <Route
                path="/faculty"
                element={
                  <ProtectedRoute allowedRoles={['faculty']}>
                    <FacultyLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<FacultyDashboard />} />
                <Route path="take-attendance" element={<TakeAttendance />} />
                <Route path="history" element={<AttendanceHistory />} />
                <Route path="timetable" element={<FacultyTimetable />} />
                <Route path="classes" element={<FacultyClasses />} />
                <Route path="leaves" element={<LeaveInbox />} />
                <Route path="disputes" element={<DisputesInbox />} />
              </Route>

              {/* Student Routes */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<MyAttendance />} />
                <Route path="projections" element={<Projections />} />
                <Route path="timetable" element={<StudentTimetable />} />
                <Route path="apply-leave" element={<ApplyLeave />} />
                <Route path="leaves" element={<LeaveHistory />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Parent Routes */}
              <Route
                path="/parent"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ParentDashboard />} />
              </Route>

              {/* Catch-all - redirect to root */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
