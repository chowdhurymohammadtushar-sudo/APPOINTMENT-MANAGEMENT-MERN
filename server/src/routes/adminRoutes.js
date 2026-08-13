import express from "express";
import {
  dashboard,
  getPendingDoctors,
  listUsers,
  setUserStatus,
  updateDoctorApproval,
  getApprovedDoctors,
} from "../controllers/adminController.js";
import { authorize, protect } from "../middleware/auth.js";
import { cancelAppointment } from "../controllers/appointmentController.js";
import { getAuditLogs } from "../controllers/auditLogController.js";

const router = express.Router();
router.use(protect, authorize("admin"));

router.get("/dashboard", dashboard);
router.get("/doctors/pending", getPendingDoctors);
router.get("/doctors/approved", getApprovedDoctors);
router.patch("/doctors/:doctorId/approval", updateDoctorApproval);
router.get("/users", listUsers);
router.patch("/users/:userId/status", setUserStatus);
router.patch("/appointments/:appointmentId/cancel", cancelAppointment);
router.get("/audit-logs", getAuditLogs);

export default router;
