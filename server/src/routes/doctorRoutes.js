import express from "express";

import {
  deleteSchedule,
  getAvailableSlots,
  getDoctor,
  getDoctorFilterOptions,
  getMyProfile,
  getMySchedules,
  listDoctors,
  updateMyProfile,
  upsertSchedule,
} from "../controllers/doctorController.js";

import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

/* =========================
   DOCTOR FILTERS
   MUST BE BEFORE :doctorId
========================= */
router.get("/filters", protect, getDoctorFilterOptions);

/* =========================
   DOCTOR LIST
========================= */
router.get("/", protect, listDoctors);

/* =========================
   DOCTOR OWN PROFILE
========================= */
router.get(
  "/me/profile",
  protect,
  authorize("doctor"),
  getMyProfile
);

router.put(
  "/me/profile",
  protect,
  authorize("doctor"),
  updateMyProfile
);

/* =========================
   DOCTOR SCHEDULES
========================= */
router.get(
  "/me/schedules",
  protect,
  authorize("doctor"),
  getMySchedules
);

router.post(
  "/me/schedules",
  protect,
  authorize("doctor"),
  upsertSchedule
);

router.delete(
  "/me/schedules/:scheduleId",
  protect,
  authorize("doctor"),
  deleteSchedule
);

/* =========================
   AVAILABLE SLOTS
========================= */
router.get(
  "/:doctorId/slots",
  protect,
  getAvailableSlots
);

/* =========================
   SINGLE DOCTOR
   MUST BE LAST
========================= */
router.get(
  "/:doctorId",
  protect,
  getDoctor
);

export default router;