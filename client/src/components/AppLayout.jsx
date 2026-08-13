import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = {
  admin: [
    ["/admin", "Dashboard"],
    ["/admin/doctors", "Doctor approvals"],
  ],
  doctor: [
    ["/doctor", "Dashboard"],
    ["/doctor/schedule", "My schedule"],
    ["/doctor/appointments", "Appointments"],
  ],
  patient: [
    ["/patient", "Dashboard"],
    ["/patient/doctors", "Find doctors"],
    ["/patient/appointments", "My appointments"],
  ],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return null;
  }

  const roleLinks = links[user.role] || [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">MediSchedule</div>

        <div className="user-card">
          <strong>{user.name}</strong>
          <span>{user.role}</span>
        </div>

        <nav>
          {roleLinks.map(([path, label]) => (
            <NavLink
              key={path}
              to={path}
              end={path.split("/").length === 2}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          className="secondary-button logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}