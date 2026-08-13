import { useEffect, useState } from "react";
import api from "../../api/api";
import StatusBadge from "../../components/StatusBadge";


export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState({});
  const [doctorNotes, setDoctorNotes] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

const load = async () => {
  try {
    const { data } = await api.get("/appointments/mine");

    const visibleAppointments = (data.appointments || []).filter(
      (appointment) => appointment.status !== "rejected"
    );

    setAppointments(visibleAppointments);
  } catch (err) {
    console.error("Failed to load appointments:", err);
    setError("Failed to load appointments");
  }
};
  useEffect(() => {
    load();
  }, []);

  const update = async (id, status) => {
    try {
      setError("");
      setMessage("");

      await api.patch(`/appointments/${id}/status`, { status });

      setMessage(`Appointment ${status}.`);
      load();
    } catch (err) {
      console.error("Update failed:", err);
      setError(err.response?.data?.message || "Update failed");
    }
  };

  const completeWithPrescription = async (id) => {
    try {
      setError("");
      setMessage("");

      const prescription = prescriptions[id] || "";
      const doctorNote = doctorNotes[id] || "";

      if (!prescription.trim()) {
        setError("Please write prescription before completing appointment.");
        return;
      }

      await api.patch(`/appointments/${id}/status`, {
        status: "completed",
        prescription,
        doctorNote,
      });

      setMessage("Appointment completed with prescription.");
      setPrescriptions((prev) => ({ ...prev, [id]: "" }));
      setDoctorNotes((prev) => ({ ...prev, [id]: "" }));
      load();
    } catch (err) {
      console.error("Complete failed:", err);
      setError(err.response?.data?.message || "Failed to complete appointment");
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Appointments</h1>
          <p>Manage patient requests and completed visits.</p>
        </div>
      </div>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="card-list">
        {appointments.length === 0 && (
          <div className="empty-card">No appointments yet.</div>
        )}

        {appointments.map((item) => (
          <article className="content-card stacked" key={item._id}>
            <div className="content-card-header">
              <div>
                <h3>{item.patient?.name || "Unknown patient"}</h3>
                <p>
                  {item.appointmentDate} · {item.startTime}–{item.endTime}
                </p>
              </div>

              <StatusBadge status={item.status} />
            </div>

            <p>
              <strong>Reason:</strong> {item.reason}
            </p>

            {item.symptoms && (
              <p>
                <strong>Symptoms:</strong> {item.symptoms}
              </p>
            )}

            {item.status === "pending" && (
              <div className="button-row">
                <button type="button" onClick={() => update(item._id, "confirmed")}>
                  Confirm
                </button>

                <button
                  type="button"
                  className="danger-button"
                  onClick={() => update(item._id, "rejected")}
                >
                  Reject
                </button>
              </div>
            )}

            {item.status === "confirmed" && (
              <div className="prescription-box">
                <label>
                  Doctor note
                  <textarea
                    placeholder="Optional note for patient..."
                    value={doctorNotes[item._id] || ""}
                    onChange={(e) =>
                      setDoctorNotes({
                        ...doctorNotes,
                        [item._id]: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Prescription
                  <textarea
                    placeholder="Write medicines, dosage, duration, advice..."
                    value={prescriptions[item._id] || ""}
                    onChange={(e) =>
                      setPrescriptions({
                        ...prescriptions,
                        [item._id]: e.target.value,
                      })
                    }
                  />
                </label>

                <div className="button-row">
                  <button
                    type="button"
                    onClick={() => completeWithPrescription(item._id)}
                  >
                    Complete with prescription
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => update(item._id, "no-show")}
                  >
                    No-show
                  </button>
                </div>
              </div>
            )}

            {item.status === "completed" && item.prescription && (
              <div className="prescription-view">
                <h4>Prescription</h4>
                <p>{item.prescription}</p>

                {item.doctorNote && (
                  <>
                    <h4>Doctor note</h4>
                    <p>{item.doctorNote}</p>
                  </>
                )}

                {item.prescribedAt && (
                  <small>
                    Prescribed on{" "}
                    {new Date(item.prescribedAt).toLocaleDateString()}
                  </small>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}