import User from "../models/User.js";
import DoctorProfile from "../models/DoctorProfile.js";
import Appointment from "../models/Appointment.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAdminAction } from "../utils/auditLogger.js";

export const dashboard = asyncHandler(async (req, res) => {
  const [
    doctors,
    patients,
    appointments,
    pendingDoctors,
    pendingAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
  ] = await Promise.all([
    User.countDocuments({ role: "doctor" }),
    User.countDocuments({ role: "patient" }),
    Appointment.countDocuments(),
    DoctorProfile.countDocuments({ approvalStatus: "pending" }),
    Appointment.countDocuments({ status: "pending" }),
    Appointment.countDocuments({ status: "confirmed" }),
    Appointment.countDocuments({ status: "completed" }),
    Appointment.countDocuments({ status: "cancelled" }),
  ]);

  res.json({
    success: true,
    stats: {
      doctors,
      patients,
      appointments,
      pendingDoctors,
      appointmentsByStatus: {
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
      },
    },
  });
});

export const getPendingDoctors = asyncHandler(async (req, res) => {
  const doctors = await DoctorProfile.find({ approvalStatus: "pending" })
    .populate("user", "name email phone isActive")
    .sort({ createdAt: 1 });

  res.json({ success: true, doctors });
});

// approved doctors লিস্ট — "Unapprove" বাটন দেখানোর জন্য।
export const getApprovedDoctors = asyncHandler(async (req, res) => {
  const doctors = await DoctorProfile.find({ approvalStatus: "approved" })
    .populate("user", "name email phone isActive")
    .sort({ updatedAt: -1 });

  res.json({ success: true, doctors });
});

export const updateDoctorApproval = asyncHandler(async (req, res) => {
  const { status } = req.body;

  // "pending" যোগ করা হয়েছে যাতে "Unapprove" করলে ডাক্তার
  // আবার pending তালিকায় ফিরে যায়, একেবারে reject/delete না হয়ে যায়।
  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be approved, rejected, or pending",
    });
  }

  const profile = await DoctorProfile.findById(req.params.doctorId).populate(
    "user",
    "name email"
  );

  if (!profile) {
    return res
      .status(404)
      .json({ success: false, message: "Doctor profile not found" });
  }

  const previousStatus = profile.approvalStatus;

  profile.approvalStatus = status;
  await profile.save();

  // audit log এর জন্য স্পষ্ট action নাম ঠিক করা হচ্ছে
  let action = "doctor.rejected";

  if (status === "approved") {
    action = "doctor.approved";
  } else if (status === "pending" && previousStatus === "approved") {
    action = "doctor.unapproved";
  } else if (status === "rejected") {
    action = "doctor.rejected";
  }

  const adminId = req.user?._id || req.user?.id;

  await logAdminAction({
    adminId,
    action,
    targetType: "DoctorProfile",
    targetId: profile._id,
    details: {
      doctorName: profile.user?.name,
      previousStatus,
      newStatus: status,
    },
    req,
  });

  res.json({ success: true, message: `Doctor ${status}`, doctor: profile });
});

export const listUsers = asyncHandler(async (req, res) => {
  const filter = req.query.role ? { role: req.query.role } : {};
  const users = await User.find(filter).sort({ createdAt: -1 });

  res.json({ success: true, users });
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user.role === "admin") {
    return res.status(400).json({
      success: false,
      message: "Admin status cannot be changed here",
    });
  }

  const previousStatus = user.isActive;

  user.isActive = Boolean(req.body.isActive);
  await user.save();

  const adminId = req.user?._id || req.user?.id;

  await logAdminAction({
    adminId,
    action: user.isActive ? "user.activated" : "user.suspended",
    targetType: "User",
    targetId: user._id,
    details: {
      userName: user.name,
      userRole: user.role,
      previousStatus,
      newStatus: user.isActive,
    },
    req,
  });

  res.json({ success: true, message: "User status updated", user });
});