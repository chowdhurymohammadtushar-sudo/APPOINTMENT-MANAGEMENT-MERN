import { useEffect, useState } from "react";
import api from "../../api/api";

export default function DoctorApprovals() {
  const [doctors, setDoctors] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/admin/doctors/pending");

      console.log("Pending doctors response:", data);

      setDoctors(data.doctors || []);
    } catch (err) {
      console.error("Pending doctors error:", err);
      setDoctors([]);
      setError(err.response?.data?.message || "Failed to load pending doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (id, status) => {
    try {
      setError("");
      setMessage("");

      await api.patch(`/admin/doctors/${id}/approval`, { status });

      setMessage(`Doctor ${status}.`);
      load();
    } catch (err) {
      console.error("Approval error:", err);
      setError(err.response?.data?.message || `Failed to mark doctor as ${status}`);
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Doctor approvals</h1>
          <p>Review newly registered doctors.</p>
        </div>
      </div>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      {loading && <p className="muted">Loading pending doctors...</p>}

      <div className="card-list">
        {!loading && doctors.length === 0 && (
          <div className="empty-card">No pending doctor approvals.</div>
        )}

        {doctors.map((doctor) => {
          const user = doctor.user || {};

          return (
            <article className="content-card" key={doctor._id}>
              <div>
                <h3>{user.name || "Unnamed Doctor"}</h3>

                <p>
                  {doctor.specialization || "No specialization"} ·{" "}
                  {doctor.qualification || "No qualification"}
                </p>

                <small>
                  {user.email || "No email"} · License:{" "}
                  {doctor.licenseNumber || "N/A"}
                </small>
              </div>

              <div className="button-row">
                <button
                  type="button"
                  onClick={() => decide(doctor._id, "approved")}
                >
                  Approve
                </button>

                <button
                  type="button"
                  className="danger-button"
                  onClick={() => decide(doctor._id, "rejected")}
                >
                  Reject
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
