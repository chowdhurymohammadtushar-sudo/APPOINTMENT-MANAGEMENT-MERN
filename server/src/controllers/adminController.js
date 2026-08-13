import User from "../models/User.js";
import DoctorProfile from "../models/DoctorProfile.js";
import Appointment from "../models/Appointment.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const dashboard = asyncHandler(async (req, res) => {
  const [doctors, patients, appointments, pendingDoctors] = await Promise.all([
    User.countDocuments({ role: "doctor" }),
    User.countDocuments({ role: "patient" }),
    Appointment.countDocuments(),
    DoctorProfile.countDocuments({ approvalStatus: "pending" }),
  ]);

  res.json({ success: true, stats: { doctors, patients, appointments, pendingDoctors } });
});

export const getPendingDoctors = asyncHandler(async (req, res) => {
  const doctors = await DoctorProfile.find({ approvalStatus: "pending" })
    .populate("user", "name email phone isActive")
    .sort({ createdAt: 1 });
  res.json({ success: true, doctors });
});

export const updateDoctorApproval = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be approved or rejected" });
  }

  const profile = await DoctorProfile.findById(req.params.doctorId).populate("user", "name email");
  if (!profile) return res.status(404).json({ success: false, message: "Doctor profile not found" });

  profile.approvalStatus = status;
  await profile.save();
  res.json({ success: true, message: `Doctor ${status}`, doctor: profile });
});

export const listUsers = asyncHandler(async (req, res) => {
  const filter = req.query.role ? { role: req.query.role } : {};
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, users });
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (user.role === "admin") return res.status(400).json({ success: false, message: "Admin status cannot be changed here" });
  user.isActive = Boolean(req.body.isActive);
  await user.save();
  res.json({ success: true, message: "User status updated", user });
});
