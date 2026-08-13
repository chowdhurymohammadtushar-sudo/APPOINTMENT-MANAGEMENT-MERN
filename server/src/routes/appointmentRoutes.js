import express from "express";
import {
  cancelAppointment,
  createAppointment,
  getMyAppointments,
  updateStatus,
} from "../controllers/appointmentController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.get("/mine", authorize("doctor", "patient"), getMyAppointments);
router.post("/", authorize("patient"), createAppointment);
router.patch("/:appointmentId/status", authorize("doctor"), updateStatus);
router.patch("/:appointmentId/cancel", authorize("patient"), cancelAppointment);
export default router;
