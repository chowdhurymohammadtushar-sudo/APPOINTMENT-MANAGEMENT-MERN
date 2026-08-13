import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dayOfWeek: {
      type: String,
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },
    startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    slotDuration: { type: Number, min: 5, max: 240, default: 30 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

scheduleSchema.index({ doctor: 1, dayOfWeek: 1 }, { unique: true });

export default mongoose.model("Schedule", scheduleSchema);
