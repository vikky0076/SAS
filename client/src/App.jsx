import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ScanQR from './pages/ScanQR';
import AttendanceHistory from './pages/AttendanceHistory';
import DeviceStatus from './pages/DeviceStatus';
import ManageSubjects from './pages/ManageSubjects';
import StartSession from './pages/StartSession';
import DeviceRequests from './pages/DeviceRequests';
import Reports from './pages/Reports';
import ManageTeachers from './pages/ManageTeachers';
import ManageStudents from './pages/ManageStudents';
import MentorDashboard from './pages/MentorDashboard';

// Route decider for dashboard based on user role
const DashboardRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'teacher') return <TeacherDashboard />;
  return <StudentDashboard />;
};

// Route wrapper to secure access
const ProtectedLayout = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 bg-slate-50/50 dark:bg-slate-950/20 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Shared Layout Routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/history" element={<AttendanceHistory />} />
          <Route path="/subjects" element={<ManageSubjects />} />
        </Route>

        {/* Student Specific Routes */}
        <Route element={<ProtectedLayout allowedRoles={['student']} />}>
          <Route path="/scan" element={<ScanQR />} />
          <Route path="/device-status" element={<DeviceStatus />} />
        </Route>

        {/* Teacher/Admin Specific Routes */}
        <Route element={<ProtectedLayout allowedRoles={['teacher', 'admin']} />}>
          <Route path="/start-session" element={<StartSession />} />
          <Route path="/device-requests" element={<DeviceRequests />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/manage-students" element={<ManageStudents />} />
          <Route path="/mentor-dashboard" element={<MentorDashboard />} />
        </Route>

        {/* Admin Specific Routes */}
        <Route element={<ProtectedLayout allowedRoles={['admin']} />}>
          <Route path="/manage-teachers" element={<ManageTeachers />} />
        </Route>

        {/* Fallbacks */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
