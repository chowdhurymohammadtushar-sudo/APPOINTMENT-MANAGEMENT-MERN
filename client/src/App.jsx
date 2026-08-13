import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DoctorApprovals from "./pages/admin/DoctorApprovals";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import SchedulePage from "./pages/doctor/SchedulePage";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import PatientDashboard from "./pages/patient/PatientDashboard";
import DoctorsPage from "./pages/patient/DoctorsPage";
import PatientAppointments from "./pages/patient/PatientAppointments";
import { useAuth } from "./context/AuthContext";
import "./status.css";

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? `/${user.role}` : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute roles={["admin", "doctor", "patient"]}><AppLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/doctors" element={<ProtectedRoute roles={["admin"]}><DoctorApprovals /></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute roles={["doctor"]}><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/schedule" element={<ProtectedRoute roles={["doctor"]}><SchedulePage /></ProtectedRoute>} />
        <Route path="/doctor/appointments" element={<ProtectedRoute roles={["doctor"]}><DoctorAppointments /></ProtectedRoute>} />
        <Route path="/patient" element={<ProtectedRoute roles={["patient"]}><PatientDashboard /></ProtectedRoute>} />
        <Route path="/patient/doctors" element={<ProtectedRoute roles={["patient"]}><DoctorsPage /></ProtectedRoute>} />
        <Route path="/patient/appointments" element={<ProtectedRoute roles={["patient"]}><PatientAppointments /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
