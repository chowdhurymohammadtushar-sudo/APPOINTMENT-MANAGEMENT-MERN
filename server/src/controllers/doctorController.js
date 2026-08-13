import DoctorProfile from "../models/DoctorProfile.js";
import Schedule from "../models/Schedule.js";
import Appointment from "../models/Appointment.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getDayName,
  getTodayString,
  minutesToTime,
  timeToMinutes,
} from "../utils/time.js";

const getUserId = (req) => req.user?._id || req.user?.id;

/*
=========================================================
GET DOCTOR FILTER OPTIONS
Dynamic data from approved doctors
=========================================================
*/

export const getDoctorFilterOptions = asyncHandler(async (req, res) => {
  const doctors = await DoctorProfile.find({
    approvalStatus: "approved",
  })
    .populate("user", "name email phone isActive")
    .select(
      "specialization hospitalName consultationFee experienceYears createdAt"
    );

  const activeDoctors = doctors.filter(
    (doctor) => doctor.user?.isActive !== false
  );

  const specializations = [
    ...new Set(
      activeDoctors
        .map((doctor) => doctor.specialization?.trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  const hospitals = [
    ...new Set(
      activeDoctors
        .map((doctor) => doctor.hospitalName?.trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  const fees = [
    ...new Set(
      activeDoctors
        .map((doctor) => Number(doctor.consultationFee))
        .filter((fee) => Number.isFinite(fee))
    ),
  ].sort((a, b) => a - b);

  const experiences = [
    ...new Set(
      activeDoctors
        .map((doctor) => Number(doctor.experienceYears))
        .filter((year) => Number.isFinite(year))
    ),
  ].sort((a, b) => a - b);

  res.json({
    success: true,
    filters: {
      specializations,
      hospitals,
      fees,
      experiences,
    },
  });
});

/*
=========================================================
LIST DOCTORS
All filters work individually AND together
=========================================================
*/

export const listDoctors = asyncHandler(async (req, res) => {
  const {
    search = "",
    specialization = "",
    hospital = "",
    maxFee = "",
    minExperience = "",
    sort = "newest",
  } = req.query;

  const query = {
    approvalStatus: "approved",
  };

  /*
  Specialization
  */
  if (specialization.trim()) {
    query.specialization = new RegExp(
      specialization.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
  }

  /*
  Hospital
  */
  if (hospital.trim()) {
    query.hospitalName = new RegExp(
      hospital.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
  }

  /*
  Maximum consultation fee
  */
  if (maxFee !== "") {
    const fee = Number(maxFee);

    if (Number.isFinite(fee)) {
      query.consultationFee = {
        $lte: fee,
      };
    }
  }

  /*
  Minimum experience
  */
  if (minExperience !== "") {
    const experience = Number(minExperience);

    if (Number.isFinite(experience)) {
      query.experienceYears = {
        $gte: experience,
      };
    }
  }

  /*
  Get doctors
  */
  let doctors = await DoctorProfile.find(query)
    .populate("user", "name email phone isActive")
    .lean();

  /*
  Only active users
  */
  doctors = doctors.filter((doctor) => {
    return doctor.user?.isActive !== false;
  });

  /*
  Search by:
  - doctor name
  - specialization
  - hospital
  */
  const searchText = search.trim().toLowerCase();

  if (searchText) {
    doctors = doctors.filter((doctor) => {
      const name = doctor.user?.name || "";
      const specializationText = doctor.specialization || "";
      const hospitalText = doctor.hospitalName || "";

      const text = `
        ${name}
        ${specializationText}
        ${hospitalText}
      `.toLowerCase();

      return text.includes(searchText);
    });
  }

  /*
  Sorting
  */
  if (sort === "feeLow") {
    doctors.sort(
      (a, b) =>
        Number(a.consultationFee || 0) -
        Number(b.consultationFee || 0)
    );
  } else if (sort === "feeHigh") {
    doctors.sort(
      (a, b) =>
        Number(b.consultationFee || 0) -
        Number(a.consultationFee || 0)
    );
  } else if (sort === "experienceHigh") {
    doctors.sort(
      (a, b) =>
        Number(b.experienceYears || 0) -
        Number(a.experienceYears || 0)
    );
  } else if (sort === "experienceLow") {
    doctors.sort(
      (a, b) =>
        Number(a.experienceYears || 0) -
        Number(b.experienceYears || 0)
    );
  } else {
    /*
    Newest
    */
    doctors.sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    );
  }

  res.json({
    success: true,
    count: doctors.length,
    doctors,
  });
});

/*
=========================================================
GET SINGLE DOCTOR
=========================================================
*/

export const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await DoctorProfile.findOne({
    user: req.params.doctorId,
    approvalStatus: "approved",
  }).populate("user", "name email phone isActive");

  if (!doctor || !doctor.user?.isActive) {
    return res.status(404).json({
      success: false,
      message: "Doctor not found",
    });
  }

  const schedules = await Schedule.find({
    doctor: req.params.doctorId,
    isAvailable: true,
  }).sort({
    dayOfWeek: 1,
  });

  res.json({
    success: true,
    doctor,
    schedules,
  });
});

/*
=========================================================
GET AVAILABLE SLOTS
=========================================================
*/

export const getAvailableSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
    return res.status(400).json({
      success: false,
      message: "A valid date in YYYY-MM-DD format is required",
    });
  }

  if (date < getTodayString()) {
    return res.status(400).json({
      success: false,
      message: "Date cannot be in the past",
    });
  }

  const doctor = await DoctorProfile.findOne({
    user: req.params.doctorId,
    approvalStatus: "approved",
  });

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: "Approved doctor not found",
    });
  }

  const dayOfWeek = getDayName(date);

  const schedule = await Schedule.findOne({
    doctor: req.params.doctorId,
    dayOfWeek,
    isAvailable: true,
  });

  if (!schedule) {
    return res.json({
      success: true,
      date,
      dayOfWeek,
      slots: [],
    });
  }

  const start = timeToMinutes(schedule.startTime);
  const end = timeToMinutes(schedule.endTime);

  const generated = [];

  for (
    let current = start;
    current + schedule.slotDuration <= end;
    current += schedule.slotDuration
  ) {
    generated.push({
      startTime: minutesToTime(current),
      endTime: minutesToTime(
        current + schedule.slotDuration
      ),
    });
  }

  const booked = await Appointment.find({
    doctor: req.params.doctorId,
    appointmentDate: date,
    status: {
      $in: [
        "pending",
        "confirmed",
        "completed",
        "no-show",
      ],
    },
  }).select("startTime");

  const bookedTimes = new Set(
    booked.map((item) => item.startTime)
  );

  const slots = generated.filter(
    (slot) => !bookedTimes.has(slot.startTime)
  );

  res.json({
    success: true,
    date,
    dayOfWeek,
    slots,
  });
});

/*
=========================================================
GET MY PROFILE
=========================================================
*/

export const getMyProfile = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const profile = await DoctorProfile.findOne({
    user: userId,
  }).populate("user", "name email phone");

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: "Doctor profile not found",
    });
  }

  res.json({
    success: true,
    profile,
  });
});

/*
=========================================================
UPDATE MY PROFILE
=========================================================
*/

export const updateMyProfile = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const allowed = [
    "specialization",
    "qualification",
    "experienceYears",
    "licenseNumber",
    "hospitalName",
    "consultationFee",
    "bio",
  ];

  const update = {};

  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      update[key] = req.body[key];
    }
  });

  const profile = await DoctorProfile.findOneAndUpdate(
    {
      user: userId,
    },
    update,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: "Doctor profile not found",
    });
  }

  res.json({
    success: true,
    message: "Profile updated",
    profile,
  });
});

/*
=========================================================
GET MY SCHEDULES
=========================================================
*/

export const getMySchedules = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const schedules = await Schedule.find({
    doctor: userId,
  }).sort({
    dayOfWeek: 1,
  });

  res.json({
    success: true,
    schedules,
  });
});

/*
=========================================================
CREATE / UPDATE SCHEDULE
=========================================================
*/

export const upsertSchedule = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const {
    dayOfWeek,
    startTime,
    endTime,
    slotDuration = 30,
    isAvailable = true,
  } = req.body;

  if (
    !startTime ||
    !endTime ||
    timeToMinutes(startTime) >= timeToMinutes(endTime)
  ) {
    return res.status(400).json({
      success: false,
      message: "End time must be after start time",
    });
  }

  const schedule = await Schedule.findOneAndUpdate(
    {
      doctor: userId,
      dayOfWeek,
    },
    {
      doctor: userId,
      dayOfWeek,
      startTime,
      endTime,
      slotDuration,
      isAvailable,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  res.status(201).json({
    success: true,
    message: "Schedule saved",
    schedule,
  });
});

/*
=========================================================
DELETE SCHEDULE
=========================================================
*/

export const deleteSchedule = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const schedule = await Schedule.findOneAndDelete({
    _id: req.params.scheduleId,
    doctor: userId,
  });

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: "Schedule not found",
    });
  }

  res.json({
    success: true,
    message: "Schedule deleted",
  });
});