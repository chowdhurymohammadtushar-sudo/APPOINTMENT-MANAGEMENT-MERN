import { useEffect, useState } from "react";
import api from "../../api/api";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);

  // Filters
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospital, setHospital] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [experience, setExperience] = useState("");
  const [sort, setSort] = useState("newest");

  // Filter options
  const [specializations, setSpecializations] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  // Doctor ratings
  const [doctorRatings, setDoctorRatings] = useState({});

  // Selected doctor
  const [selected, setSelected] = useState(null);

  // Booking
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [reason, setReason] = useState("");

  // Messages
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Loading
  const [loading, setLoading] = useState(false);

  // =====================================================
  // GET DOCTOR USER
  // =====================================================

  const getDoctorUser = (doctor) => {
    return doctor?.user || doctor;
  };

  // =====================================================
  // LOAD FILTER OPTIONS
  // =====================================================

  const loadFilterOptions = async () => {
    try {
      setError("");

      const { data } = await api.get("/doctors/filters");

      setSpecializations(
        data.filters?.specializations || []
      );

      setHospitals(
        data.filters?.hospitals || []
      );

      // Important:
      // Initially no doctors should appear.
      setDoctors([]);

      // Clear ratings too
      setDoctorRatings({});
    } catch (err) {
      console.error(
        "Filter loading error:",
        err
      );

      setSpecializations([]);
      setHospitals([]);
      setDoctors([]);
      setDoctorRatings({});

      setError(
        err.response?.data?.message ||
          "Failed to load doctor filters"
      );
    }
  };

  // =====================================================
  // LOAD DOCTOR RATINGS
  // =====================================================

  const loadDoctorRatings = async (doctorList) => {
    if (!doctorList || doctorList.length === 0) {
      setDoctorRatings({});
      return;
    }

    try {
      const ratings = {};

      await Promise.all(
        doctorList.map(async (doctor) => {
          try {
            const doctorUser =
              getDoctorUser(doctor);

            const doctorId =
              doctorUser?._id;

            if (!doctorId) return;

            const { data } =
              await api.get(
                `/reviews/doctor/${doctorId}`
              );

            ratings[doctorId] = {
              averageRating:
                Number(
                  data.averageRating || 0
                ),

              totalReviews:
                Number(
                  data.totalReviews || 0
                ),
            };
          } catch (err) {
            console.error(
              `Failed to load rating for doctor`,
              err
            );

            const doctorUser =
              getDoctorUser(doctor);

            const doctorId =
              doctorUser?._id;

            if (doctorId) {
              ratings[doctorId] = {
                averageRating: 0,
                totalReviews: 0,
              };
            }
          }
        })
      );

      setDoctorRatings(ratings);
    } catch (err) {
      console.error(
        "Doctor ratings loading error:",
        err
      );

      setDoctorRatings({});
    }
  };

  // =====================================================
  // LOAD DOCTORS
  // =====================================================

  const findDoctors = async (e) => {
    if (e) {
      e.preventDefault();
    }

    setLoading(true);
    setError("");
    setMessage("");
    setSelected(null);
    setSlots([]);

    try {
      const params = {};

      // Search
      if (search.trim()) {
        params.search = search.trim();
      }

      // Specialization
      if (specialization) {
        params.specialization =
          specialization;
      }

      // Hospital
      if (hospital) {
        params.hospital = hospital;
      }

      // Maximum fee
      if (maxFee) {
        params.maxFee = maxFee;
      }

      // Minimum experience
      if (experience) {
        params.minExperience =
          experience;
      }

      // Sorting
      if (sort) {
        params.sort = sort;
      }

      // =================================================
      // NO FILTER = NO DOCTORS
      // =================================================

      const hasFilter =
        Boolean(search.trim()) ||
        Boolean(specialization) ||
        Boolean(hospital) ||
        Boolean(maxFee) ||
        Boolean(experience);

      if (!hasFilter) {
        setDoctors([]);
        setDoctorRatings({});
        setLoading(false);
        return;
      }

      // =================================================
      // API REQUEST
      // =================================================

      const { data } = await api.get(
        "/doctors",
        {
          params,
        }
      );

      const doctorList =
        data.doctors || [];

      setDoctors(doctorList);

      // Load rating after doctors are loaded
      await loadDoctorRatings(
        doctorList
      );
    } catch (err) {
      console.error(
        "Doctor loading error:",
        err
      );

      setDoctors([]);
      setDoctorRatings({});

      setError(
        err.response?.data?.message ||
          "Failed to load doctors"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadFilterOptions();
  }, []);

  // =====================================================
  // RESET FILTERS
  // =====================================================

  const resetFilters = async () => {
    setSearch("");
    setSpecialization("");
    setHospital("");
    setMaxFee("");
    setExperience("");
    setSort("newest");

    setDoctors([]);
    setDoctorRatings({});

    setSelected(null);
    setSlots([]);

    setDate("");
    setReason("");

    setMessage("");
    setError("");

    await loadFilterOptions();
  };

  // =====================================================
  // LOAD AVAILABLE SLOTS
  // =====================================================

  const loadSlots = async () => {
    if (!selected || !date) {
      setMessage(
        "Please select a doctor and date first."
      );

      return;
    }

    try {
      setError("");
      setMessage("");

      const doctorUser =
        getDoctorUser(selected);

      const doctorId =
        doctorUser?._id;

      if (!doctorId) {
        setError(
          "Doctor ID not found."
        );

        return;
      }

      const { data } =
        await api.get(
          `/doctors/${doctorId}/slots`,
          {
            params: {
              date,
            },
          }
        );

      setSlots(
        data.slots || []
      );
    } catch (err) {
      console.error(
        "Slot loading error:",
        err
      );

      setSlots([]);

      setError(
        err.response?.data?.message ||
          "Failed to load slots"
      );
    }
  };

  // =====================================================
  // BOOK APPOINTMENT
  // =====================================================

  const book = async (slot) => {
    if (!reason.trim()) {
      setMessage(
        "Write a reason before booking."
      );

      return;
    }

    if (!selected || !date) {
      setMessage(
        "Please select a doctor and date."
      );

      return;
    }

    try {
      setError("");
      setMessage("");

      const doctorUser =
        getDoctorUser(selected);

      const doctorId =
        doctorUser?._id;

      if (!doctorId) {
        setError(
          "Doctor ID not found."
        );

        return;
      }

      await api.post(
        "/appointments",
        {
          doctorId,
          appointmentDate: date,
          startTime:
            slot.startTime,
          reason:
            reason.trim(),
        }
      );

      setMessage(
        "Appointment request submitted successfully."
      );

      setReason("");

      await loadSlots();
    } catch (err) {
      console.error(
        "Booking error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to book appointment"
      );
    }
  };

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
          <h1>Find doctors</h1>

          <p>
            Search and filter approved doctors
            by specialization, hospital, fee,
            and experience.
          </p>
        </div>
      </div>

      {/* =================================================
          FILTER FORM
      ================================================= */}

      <form
        className="search-row"
        onSubmit={findDoctors}
      >
        {/* SEARCH */}

        <input
          type="text"
          placeholder="Search by name, specialization, or hospital"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        {/* SPECIALIZATION */}

        <select
          value={specialization}
          onChange={(e) =>
            setSpecialization(
              e.target.value
            )
          }
        >
          <option value="">
            All Specializations
          </option>

          {specializations.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            )
          )}
        </select>

        {/* HOSPITAL */}

        <select
          value={hospital}
          onChange={(e) =>
            setHospital(
              e.target.value
            )
          }
        >
          <option value="">
            All Hospitals
          </option>

          {hospitals.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            )
          )}
        </select>

        {/* MAXIMUM FEE */}

        <select
          value={maxFee}
          onChange={(e) =>
            setMaxFee(
              e.target.value
            )
          }
        >
          <option value="">
            Maximum Fee
          </option>

          <option value="500">
            ৳500 or less
          </option>

          <option value="1000">
            ৳1000 or less
          </option>

          <option value="1500">
            ৳1500 or less
          </option>

          <option value="2000">
            ৳2000 or less
          </option>
        </select>

        {/* EXPERIENCE */}

        <select
          value={experience}
          onChange={(e) =>
            setExperience(
              e.target.value
            )
          }
        >
          <option value="">
            Any Experience
          </option>

          <option value="1">
            1+ Years
          </option>

          <option value="3">
            3+ Years
          </option>

          <option value="5">
            5+ Years
          </option>

          <option value="10">
            10+ Years
          </option>
        </select>

        {/* SORT */}

        <select
          value={sort}
          onChange={(e) =>
            setSort(
              e.target.value
            )
          }
        >
          <option value="newest">
            Sort: Newest
          </option>

          <option value="feeLow">
            Fee: Low to High
          </option>

          <option value="feeHigh">
            Fee: High to Low
          </option>

          <option value="experienceHigh">
            Experience: High to Low
          </option>
        </select>

        {/* FIND BUTTON */}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Finding..."
            : "Find Doctors"}
        </button>

        {/* RESET BUTTON */}

        <button
          type="button"
          className="secondary-button"
          onClick={resetFilters}
        >
          Reset
        </button>
      </form>

      {/* =================================================
          MESSAGES
      ================================================= */}

      {message && (
        <div className="alert success">
          {message}
        </div>
      )}

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (
        <p className="muted">
          Finding doctors...
        </p>
      )}

      {/* =================================================
          INITIAL STATE
      ================================================= */}

      {!loading &&
        doctors.length === 0 &&
        !error &&
        !(
          search.trim() ||
          specialization ||
          hospital ||
          maxFee ||
          experience
        ) && (
          <p className="muted">
            Select a filter or search for a
            doctor to see results.
          </p>
        )}

      {/* =================================================
          NO RESULT
      ================================================= */}

      {!loading &&
        doctors.length === 0 &&
        !error &&
        (
          search.trim() ||
          specialization ||
          hospital ||
          maxFee ||
          experience
        ) && (
          <p className="muted">
            No doctors found matching your
            filters.
          </p>
        )}

      {/* =================================================
          DOCTOR CARDS
      ================================================= */}

      <div className="doctor-grid">
        {doctors.map((doctor) => {
          const doctorUser =
            getDoctorUser(doctor);

          const doctorId =
            doctorUser?._id;

          const rating =
            doctorRatings[
              doctorId
            ];

          return (
            <article
              className={`doctor-card ${
                selected?._id ===
                doctor._id
                  ? "selected"
                  : ""
              }`}
              key={doctor._id}
              onClick={() => {
                setSelected(doctor);
                setSlots([]);
                setDate("");
                setReason("");
                setMessage("");
                setError("");
              }}
            >
              {/* AVATAR */}

              <div className="avatar">
                {doctorUser?.name
                  ?.charAt(0)
                  ?.toUpperCase() ||
                  "D"}
              </div>

              {/* NAME */}

              <h3>
                {doctorUser?.name ||
                  "Unnamed Doctor"}
              </h3>

              {/* SPECIALIZATION */}

              <p>
                {doctor.specialization ||
                  "General Physician"}
              </p>

              {/* RATING */}

              <div className="doctor-rating">
                <span className="rating-stars">
                  ⭐
                </span>

                {rating &&
                rating.totalReviews >
                  0 ? (
                  <>
                    <strong>
                      {rating.averageRating.toFixed(
                        1
                      )}
                    </strong>

                    <span className="review-count">
                      (
                      {
                        rating.totalReviews
                      }{" "}
                      reviews)
                    </span>
                  </>
                ) : (
                  <span className="review-count">
                    No reviews yet
                  </span>
                )}
              </div>

              {/* HOSPITAL */}

              <small>
                {doctor.hospitalName ||
                  "Independent practice"}
              </small>

              {/* EXPERIENCE */}

              <small>
                {doctor.experienceYears ??
                  0}{" "}
                years experience
              </small>

              {/* CONSULTATION FEE */}

              <strong>
                ৳
                {doctor.consultationFee ??
                  0}
              </strong>
            </article>
          );
        })}
      </div>

      {/* =================================================
          BOOKING PANEL
      ================================================= */}

      {selected && (
        <div className="content-card booking-panel">
          <h2>
            Book{" "}
            {getDoctorUser(
              selected
            )?.name ||
              "Doctor"}
          </h2>

          <div className="form-grid">
            {/* DATE */}

            <label>
              Date

              <input
                type="date"
                value={date}
                min={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                onChange={(e) => {
                  setDate(
                    e.target.value
                  );

                  setSlots([]);
                  setMessage("");
                }}
              />
            </label>

            {/* REASON */}

            <label>
              Reason

              <input
                type="text"
                value={reason}
                onChange={(e) =>
                  setReason(
                    e.target.value
                  )
                }
                placeholder="e.g. fever and headache"
              />
            </label>
          </div>

          {/* SLOT BUTTON */}

          <button
            type="button"
            onClick={loadSlots}
          >
            Show available slots
          </button>

          {/* SLOTS */}

          <div className="slot-grid">
            {slots.map((slot) => (
              <button
                type="button"
                className="slot-button"
                key={
                  slot.startTime
                }
                onClick={() =>
                  book(slot)
                }
              >
                {slot.startTime}
              </button>
            ))}
          </div>

          {/* NO SLOT */}

          {date &&
            slots.length === 0 && (
              <p className="muted">
                No available slot loaded
                for this date.
              </p>
            )}
        </div>
      )}
    </section>
  );
}