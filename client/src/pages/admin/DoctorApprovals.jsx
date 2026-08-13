import { useEffect, useState } from "react";
import api from "../../api/api";

export default function DoctorApprovals() {
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "approved"
  const [doctors, setDoctors] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (tab) => {
    setLoading(true);
    setError("");

    try {
      const endpoint =
        tab === "pending" ? "/admin/doctors/pending" : "/admin/doctors/approved";

      const { data } = await api.get(endpoint);

      console.log(`${tab} doctors response:`, data);

      setDoctors(data.doctors || []);
    } catch (err) {
      console.error(`${tab} doctors error:`, err);
      setDoctors([]);
      setError(err.response?.data?.message || `Failed to load ${tab} doctors`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeTab);
  }, [activeTab]);

  const decide = async (id, status) => {
    try {
      setError("");
      setMessage("");

      await api.patch(`/admin/doctors/${id}/approval`, { status });

      const messages = {
        approved: "Doctor approved.",
        rejected: "Doctor rejected.",
        pending: "Doctor moved back to pending.",
      };
      setMessage(messages[status] || `Doctor ${status}.`);

      load(activeTab);
    } catch (err) {
      console.error("Approval error:", err);
      setError(err.response?.data?.message || `Failed to update doctor status`);
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

      <div className="tab-row">
        <button
          type="button"
          className={activeTab === "pending" ? "tab active" : "tab"}
          onClick={() => setActiveTab("pending")}
        >
          Pending
        </button>

        <button
          type="button"
          className={activeTab === "approved" ? "tab active" : "tab"}
          onClick={() => setActiveTab("approved")}
        >
          Approved
        </button>
      </div>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      {loading && (
        <p className="muted">
          Loading {activeTab === "pending" ? "pending" : "approved"} doctors...
        </p>
      )}

      <div className="card-list">
        {!loading && doctors.length === 0 && (
          <div className="empty-card">
            No {activeTab === "pending" ? "pending" : "approved"} doctors.
          </div>
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
                {activeTab === "pending" ? (
                  <>
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
                  </>
                ) : (
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => decide(doctor._id, "pending")}
                  >
                    Unapprove
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}