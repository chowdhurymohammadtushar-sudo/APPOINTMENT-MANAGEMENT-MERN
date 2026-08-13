import Appointment from "../models/Appointment.js";
import DoctorProfile from "../models/DoctorProfile.js";
import Schedule from "../models/Schedule.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getDayName,
  getTodayString,
  minutesToTime,
  timeToMinutes,
} from "../utils/time.js";

const getUserId = (req) => req.user?._id || req.user?.id;

const activeBookingKey = (doctorId, date, startTime) =>
  `${doctorId}:${date}:${startTime}`;

const validateSlot = async ({ doctorId, date, startTime }) => {
  const doctor = await DoctorProfile.findOne({
    user: doctorId,
    approvalStatus: "approved",
  });

  if (!doctor) {
    return { error: "Approved doctor not found" };
  }

  const schedule = await Schedule.findOne({
    doctor: doctorId,
    dayOfWeek: getDayName(date),
    isAvailable: true,
  });

  if (!schedule) {
    return { error: "Doctor is not available on this day" };
  }

  const start = timeToMinutes(schedule.startTime);
  const end = timeToMinutes(schedule.endTime);
  const selected = timeToMinutes(startTime);

  const valid =
    selected >= start &&
    selected + schedule.slotDuration <= end &&
    (selected - start) % schedule.slotDuration === 0;

  if (!valid) {
    return { error: "Invalid appointment slot" };
  }

  return {
    doctor,
    schedule,
    endTime: minutesToTime(selected + schedule.slotDuration),
  };
};

/* CREATE APPOINTMENT */
export const createAppointment = asyncHandler(async (req, res) => {
  const patientId = getUserId(req);

  const { doctorId, appointmentDate, startTime, reason, symptoms } = req.body;

  if (!patientId) {
    return res.status(401).json({
      success: false,
      message: "Patient authentication required",
    });
  }

  if (!doctorId || !appointmentDate || !startTime || !reason) {
    return res.status(400).json({
      success: false,
      message: "Doctor, date, time and reason are required",
    });
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate) ||
    appointmentDate < getTodayString()
  ) {
    return res.status(400).json({
      success: false,
      message: "Choose a valid present or future date",
    });
  }

  const slot = await validateSlot({
    doctorId,
    date: appointmentDate,
    startTime,
  });

  if (slot.error) {
    return res.status(400).json({
      success: false,
      message: slot.error,
    });
  }

  const appointment = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
    appointmentDate,
    startTime,
    endTime: slot.endTime,
    reason,
    symptoms: symptoms || "",
    bookingKey: activeBookingKey(doctorId, appointmentDate, startTime),
  });

  await appointment.populate([
    { path: "patient", select: "name email phone" },
    { path: "doctor", select: "name email phone" },
  ]);

  res.status(201).json({
    success: true,
    message: "Appointment request submitted",
    appointment,
  });
});

/* GET MY APPOINTMENTS */
export const getMyAppointments = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const query =
    req.user.role === "doctor"
      ? { doctor: userId }
      : { patient: userId };

  const appointments = await Appointment.find(query)
    .populate("patient", "name email phone")
    .populate("doctor", "name email phone")
    .sort({ appointmentDate: -1, startTime: -1 });

  res.json({
    success: true,
    appointments,
  });
});

/* UPDATE APPOINTMENT STATUS + PRESCRIPTION */
export const updateStatus = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const {
    status,
    doctorNote = "",
    prescription = "",
  } = req.body;

  const allowed = ["confirmed", "rejected", "completed", "no-show"];

  if (!allowed.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status",
    });
  }

  const appointment = await Appointment.findOne({
    _id: req.params.appointmentId,
    doctor: userId,
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: "Appointment not found",
    });
  }

  if (status === "completed" && !prescription.trim()) {
    return res.status(400).json({
      success: false,
      message: "Prescription is required before completing appointment",
    });
  }

  appointment.status = status;
  appointment.doctorNote = doctorNote;

  if (status === "completed") {
    appointment.prescription = prescription.trim();
    appointment.prescribedAt = new Date();
  }

  if (status === "rejected") {
    appointment.bookingKey = undefined;
  }

  await appointment.save();

  await appointment.populate([
    { path: "patient", select: "name email phone" },
    { path: "doctor", select: "name email phone" },
  ]);

  res.json({
    success: true,
    message: "Appointment updated",
    appointment,
  });
});

/* CANCEL APPOINTMENT */
export const cancelAppointment = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const query =
    req.user.role === "admin"
      ? { _id: req.params.appointmentId }
      : { _id: req.params.appointmentId, patient: userId };

  const appointment = await Appointment.findOne(query);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: "Appointment not found",
    });
  }

  if (
    ["completed", "no-show", "cancelled", "rejected"].includes(
      appointment.status
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "This appointment cannot be cancelled",
    });
  }

  appointment.status = "cancelled";
  appointment.cancellationReason = req.body.reason || "Cancelled by user";
  appointment.bookingKey = undefined;

  await appointment.save();

  res.json({
    success: true,
    message: "Appointment cancelled",
    appointment,
  });
});