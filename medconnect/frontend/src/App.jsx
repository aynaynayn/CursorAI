import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Doctors from './pages/Doctors';
import DoctorProfile from './pages/DoctorProfile';
import AppointmentDetail from './pages/AppointmentDetail';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="doctors/:id" element={<DoctorProfile />} />
        <Route path="notifications" element={<PrivateRoute roles={['patient', 'doctor', 'admin']}><Notifications /></PrivateRoute>} />
        <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="appointments/:id" element={<PrivateRoute><AppointmentDetail /></PrivateRoute>} />
        <Route path="patient/dashboard" element={<PrivateRoute roles={['patient']}><PatientDashboard /></PrivateRoute>} />
        <Route path="doctor/dashboard" element={<PrivateRoute roles={['doctor']}><DoctorDashboard /></PrivateRoute>} />
        <Route path="admin/dashboard" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
