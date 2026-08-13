import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // e.g. "doctor.approved", "doctor.rejected", "user.suspended"
    action: {
      type: String,
      required: true,
      trim: true,
    },

    // e.g. "DoctorProfile", "User", "Appointment"
    targetType: {
      type: String,
      required: true,
      trim: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Any extra context — before/after values, names, reasons, etc.
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ admin: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

export default mongoose.model("AuditLog", auditLogSchema);