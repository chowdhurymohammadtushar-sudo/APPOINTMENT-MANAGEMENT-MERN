import { useEffect, useState } from "react";
import api from "../../api/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ doctors: 0, patients: 0, appointments: 0, pendingDoctors: 0 });
  useEffect(() => { api.get("/admin/dashboard").then(({ data }) => setStats(data.stats)); }, []);
  return (
    <section>
      <div className="page-heading"><div><h1>Admin dashboard</h1><p>System overview and approval activity.</p></div></div>
      <div className="stats-grid">
        {Object.entries(stats).map(([key, value]) => <article className="stat-card" key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><strong>{value}</strong></article>)}
      </div>
    </section>
  );
}
