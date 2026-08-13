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
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    startTime: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}$/,
    },

    endTime: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}$/,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    symptoms: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "rejected",
        "cancelled",
        "completed",
        "no-show",
      ],
      default: "pending",
    },

    doctorNote: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    prescription: {
      type: String,
      trim: true,
      default: "",
      maxlength: 5000,
    },

    prescribedAt: {
      type: Date,
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: "",
    },

    bookingKey: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, appointmentDate: 1, startTime: 1 });
appointmentSchema.index({ patient: 1, appointmentDate: -1 });

export default mongoose.model("Appointment", appointmentSchema);