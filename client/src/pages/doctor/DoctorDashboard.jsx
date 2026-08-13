import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD DOCTOR DASHBOARD
  // =====================================================

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [appointmentResponse, profileResponse] =
          await Promise.all([
            api.get("/appointments/mine"),
            api.get("/doctors/me/profile"),
          ]);

        setAppointments(
          appointmentResponse.data.appointments || []
        );

        const doctorProfile =
          profileResponse.data.profile;

        setProfile(doctorProfile);

        // ================================================
        // LOAD DOCTOR REVIEWS
        // ================================================

        const doctorId = doctorProfile?.user?._id;

        if (doctorId) {
          try {
            const reviewResponse = await api.get(
              `/reviews/doctor/${doctorId}`
            );

            setReviews(
              reviewResponse.data.reviews || []
            );

            setAverageRating(
              reviewResponse.data.averageRating || 0
            );

            setTotalReviews(
              reviewResponse.data.totalReviews || 0
            );
          } catch (reviewError) {
            console.error(
              "Review loading error:",
              reviewError
            );

            setReviews([]);
            setAverageRating(0);
            setTotalReviews(0);
          }
        } else {
          setReviews([]);
          setAverageRating(0);
          setTotalReviews(0);
        }
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
        setReviewLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // =====================================================
  // APPOINTMENT STATS
  // =====================================================

  const stats = useMemo(
    () => ({
      pending: appointments.filter(
        (a) => a.status === "pending"
      ).length,

      confirmed: appointments.filter(
        (a) => a.status === "confirmed"
      ).length,

      completed: appointments.filter(
        (a) => a.status === "completed"
      ).length,
    }),
    [appointments]
  );

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <section className="center-screen">
        <p className="muted">
          Loading doctor dashboard...
        </p>
      </section>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <section>
      {/* =================================================
          PAGE HEADING
      ================================================= */}

      <div className="page-heading">
        <div>
          <h1>Doctor dashboard</h1>

          <p>
            Welcome,{" "}
            <strong>
              {profile?.user?.name || "Doctor"}
            </strong>
          </p>

          <p>
            Approval:{" "}
            <strong>
              {profile?.approvalStatus || "Unknown"}
            </strong>
          </p>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {/* =================================================
          APPROVAL WARNING
      ================================================= */}

      {profile?.approvalStatus !== "approved" && (
        <div className="alert warning">
          Patients cannot book you until an admin
          approves your profile.
        </div>
      )}

      {/* =================================================
          APPOINTMENT STATS
      ================================================= */}

      <div className="stats-grid">
        {Object.entries(stats).map(
          ([key, value]) => (
            <article
              className="stat-card"
              key={key}
            >
              <span>{key}</span>
              <strong>{value}</strong>
            </article>
          )
        )}
      </div>

      {/* =================================================
          REVIEW SUMMARY
      ================================================= */}

      <div
        className="content-card"
        style={{
          marginTop: "24px",
          alignItems: "center",
        }}
      >
        <div>
          <h2>Patient Reviews</h2>

          <p className="muted">
            See what your patients think about your
            service.
          </p>
        </div>

        <div
          style={{
            textAlign: "center",
            minWidth: "150px",
          }}
        >
          <div
            style={{
              fontSize: "2rem",
              fontWeight: "900",
              color: "#f59e0b",
            }}
          >
            ⭐ {averageRating.toFixed(1)}
          </div>

          <div className="muted">
            {totalReviews}{" "}
            {totalReviews === 1
              ? "Review"
              : "Reviews"}
          </div>
        </div>
      </div>

      {/* =================================================
          REVIEWS LIST
      ================================================= */}

      <div
        className="card-list"
        style={{ marginTop: "16px" }}
      >
        {reviewLoading ? (
          <div className="empty-card">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="empty-card">
            <h3>No reviews yet</h3>

            <p>
              Patients can leave a review after
              completing an appointment.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <article
              className="content-card stacked"
              key={review._id}
            >
              {/* Review header */}

              <div className="content-card-header">
                <div>
                  <h3>
                    {review.patient?.name ||
                      "Patient"}
                  </h3>

                  <small className="muted">
                    {review.createdAt
                      ? new Date(
                          review.createdAt
                        ).toLocaleDateString()
                      : ""}
                  </small>
                </div>

                <div
                  style={{
                    fontSize: "1.1rem",
                    color: "#f59e0b",
                    letterSpacing: "2px",
                  }}
                >
                  {"⭐".repeat(
                    Number(review.rating) || 0
                  )}
                </div>
              </div>

              {/* Comment */}

              {review.comment ? (
                <p
                  style={{
                    margin: 0,
                    lineHeight: "1.7",
                    color: "#526079",
                  }}
                >
                  "{review.comment}"
                </p>
              ) : (
                <p className="muted">
                  Patient did not leave a comment.
                </p>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
