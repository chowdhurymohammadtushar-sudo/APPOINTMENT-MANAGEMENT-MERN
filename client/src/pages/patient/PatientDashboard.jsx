import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import StatusBadge from "../../components/StatusBadge";

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // LOAD APPOINTMENTS
  // =====================================================

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const { data } = await api.get("/appointments/mine");

        setAppointments(data.appointments || []);
      } catch (err) {
        console.error("Failed to load appointments:", err);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, []);

  // =====================================================
  // FIND NEXT UPCOMING APPOINTMENT
  // =====================================================

  const next = useMemo(() => {
    const now = new Date();

    const upcoming = appointments
      .filter((appointment) =>
        ["pending", "confirmed"].includes(
          appointment.status
        )
      )
      .filter((appointment) => {
        if (!appointment.appointmentDate) {
          return false;
        }

        const appointmentDate = new Date(
          `${appointment.appointmentDate}T${
            appointment.startTime || "00:00"
          }`
        );

        return appointmentDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(
          `${a.appointmentDate}T${a.startTime || "00:00"}`
        );

        const dateB = new Date(
          `${b.appointmentDate}T${b.startTime || "00:00"}`
        );

        return dateA - dateB;
      });

    return upcoming[0] || null;
  }, [appointments]);

  // =====================================================
  // SHOW POPUP WHEN UPCOMING APPOINTMENT EXISTS
  // =====================================================

  useEffect(() => {
    if (loading || !next) {
      return;
    }

    // Show popup after dashboard loads
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [loading, next]);

  // =====================================================
  // CLOSE POPUP
  // =====================================================

  const closePopup = () => {
    setShowPopup(false);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <section className="center-screen">
        <p className="muted">
          Loading your dashboard...
        </p>
      </section>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      <section>
        {/* PAGE HEADING */}

        <div className="page-heading">
          <div>
            <h1>Patient dashboard</h1>

            <p>
              Book doctors and track your visits.
            </p>
          </div>
        </div>

        {/* NEXT APPOINTMENT CARD */}

        <article className="hero-card">
          <span>Next appointment</span>

          {next ? (
            <>
              <h2>
                {next.doctor?.name ||
                  "Doctor"}
              </h2>

              <p>
                {next.appointmentDate} at{" "}
                {next.startTime}
              </p>

              {next.doctor?.hospitalName && (
                <p>
                  🏥 {next.doctor.hospitalName}
                </p>
              )}

              <StatusBadge status={next.status} />
            </>
          ) : (
            <h2>
              No upcoming appointment
            </h2>
          )}
        </article>
      </section>

      {/* =================================================
          UPCOMING APPOINTMENT POPUP
      ================================================= */}

      {showPopup && next && (
        <div
          className="appointment-popup-overlay"
          onClick={closePopup}
        >
          <div
            className="appointment-popup"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* Close button */}

            <button
              type="button"
              className="popup-close"
              onClick={closePopup}
              aria-label="Close"
            >
              ×
            </button>

            {/* Icon */}

            <div className="popup-icon">
              📅
            </div>

            {/* Heading */}

            <h2>
              Upcoming Appointment
            </h2>

            <p className="popup-subtitle">
              You have an upcoming appointment.
            </p>

            {/* Doctor */}

            <div className="popup-doctor">
              <div className="popup-avatar">
                {next.doctor?.name
                  ?.charAt(0)
                  ?.toUpperCase() || "D"}
              </div>

              <div>
                <strong>
                  {next.doctor?.name ||
                    "Doctor"}
                </strong>

                {next.doctor
                  ?.specialization && (
                  <small>
                    {
                      next.doctor
                        .specialization
                    }
                  </small>
                )}
              </div>
            </div>

            {/* Appointment information */}

            <div className="popup-info">
              <div className="popup-info-item">
                <span>📅</span>

                <div>
                  <small>Date</small>

                  <strong>
                    {next.appointmentDate}
                  </strong>
                </div>
              </div>

              <div className="popup-info-item">
                <span>⏰</span>

                <div>
                  <small>Time</small>

                  <strong>
                    {next.startTime}
                    {next.endTime
                      ? ` - ${next.endTime}`
                      : ""}
                  </strong>
                </div>
              </div>

              {next.doctor?.hospitalName && (
                <div className="popup-info-item">
                  <span>🏥</span>

                  <div>
                    <small>Hospital</small>

                    <strong>
                      {
                        next.doctor
                          .hospitalName
                      }
                    </strong>
                  </div>
                </div>
              )}

              <div className="popup-info-item">
                <span>📌</span>

                <div>
                  <small>Status</small>

                  <strong>
                    {next.status}
                  </strong>
                </div>
              </div>
            </div>

            {/* Message */}

            <div className="popup-message">
              Please arrive a few minutes before
              your appointment time.
            </div>

            {/* Button */}

            <button
              type="button"
              className="popup-ok-button"
              onClick={closePopup}
            >
              Okay, Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}