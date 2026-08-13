import { useEffect, useState } from "react";
import api from "../../api/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    appointments: 0,
    pendingDoctors: 0,
  });
  const [appointmentsByStatus, setAppointmentsByStatus] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    api.get("/admin/dashboard").then(({ data }) => {
      const { appointmentsByStatus: breakdown, ...rest } = data.stats;
      setStats(rest);
      setAppointmentsByStatus(breakdown || null);
    });
  }, []);

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Admin dashboard</h1>
          <p>System overview and approval activity.</p>
        </div>
      </div>

      <div className="stats-grid">
        {Object.entries(stats).map(([key, value]) => {
          const isAppointments = key === "appointments";

          return (
            <article
              className={isAppointments ? "stat-card clickable" : "stat-card"}
              key={key}
              role={isAppointments ? "button" : undefined}
              tabIndex={isAppointments ? 0 : undefined}
              onClick={isAppointments ? () => setShowBreakdown((p) => !p) : undefined}
              onKeyDown={
                isAppointments
                  ? (e) => e.key === "Enter" && setShowBreakdown((p) => !p)
                  : undefined
              }
            >
              <span>{key.replace(/([A-Z])/g, " $1")}</span>
              <strong>{value}</strong>
              {isAppointments && (
                <small className="stat-hint">
                  {showBreakdown ? "Hide breakdown ▲" : "View breakdown ▼"}
                </small>
              )}
            </article>
          );
        })}
      </div>

      {showBreakdown && appointmentsByStatus && (
        <div className="breakdown-panel">
          <h3>Appointments by status</h3>
          <div className="breakdown-grid">
            {Object.entries(appointmentsByStatus).map(([status, count]) => (
              <div className="breakdown-item" key={status}>
                <span className="breakdown-label">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                <span className="breakdown-value">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}