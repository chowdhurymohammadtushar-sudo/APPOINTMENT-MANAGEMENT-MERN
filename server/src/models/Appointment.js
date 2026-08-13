import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    appointmentDate: {
      type: String,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    // ==========================================
    // SERIAL NUMBER
    // ==========================================
    // Serial is calculated according to
    // appointment time, not booking order.
    //
    // So it should NOT be required in DB.
    // ==========================================

    serialNumber: {
      type: Number,
      default: null,
      min: 1,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    symptoms: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "rejected",
        "completed",
        "cancelled",
        "no-show",
      ],
      default: "pending",
    },

    doctorNote: {
      type: String,
      default: "",
    },

    prescription: {
      type: String,
      default: "",
    },

    prescribedAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: "",
    },

    // ==========================================
    // REMINDER TRACKING
    // ==========================================
    // Prevents the same appointment from getting
    // duplicate email/SMS reminders on every cron run.
    // ==========================================

    reminderSent: {
      type: Boolean,
      default: false,
    },

    /*
      Used to prevent two patients
      from booking the same doctor/date/time.
    */
    bookingKey: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);


// ==========================================
// INDEX FOR QUEUE / SERIAL
// ==========================================

appointmentSchema.index({
  doctor: 1,
  appointmentDate: 1,
  serialNumber: 1,
});


// ==========================================
// INDEX FOR TIME-BASED QUEUE
// ==========================================

appointmentSchema.index({
  doctor: 1,
  appointmentDate: 1,
  startTime: 1,
  status: 1,
});


// ==========================================
// EXPORT
// ==========================================

export default mongoose.model(
  "Appointment",
  appointmentSchema
);