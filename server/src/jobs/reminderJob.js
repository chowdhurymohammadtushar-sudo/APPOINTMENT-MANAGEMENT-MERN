import cron from "node-cron";
import Appointment from "../models/Appointment.js";
import { sendAppointmentReminderEmail } from "../utils/emailService.js";

// =========================================================
// Local-timezone-safe "tomorrow" date string (YYYY-MM-DD)
// toISOString() avoided — it always converts to UTC,
// which can shift the date by ±1 day depending on server timezone.
// =========================================================
const getTomorrowDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const runReminderJob = async () => {
  try {
    const targetDate = getTomorrowDateString();

    console.log("[reminderJob] Server current time:", new Date().toString());
    console.log("[reminderJob] Computed target date (tomorrow):", targetDate);

    const appointments = await Appointment.find({
      appointmentDate: targetDate,
      status: { $in: ["pending", "confirmed"] },
      reminderSent: { $ne: true },
    })
      .populate("patient", "name email")
      .populate("doctor", "name");

    let sentCount = 0;
    let failedCount = 0;

    for (const appt of appointments) {
      const patient = appt.patient;
      const doctor = appt.doctor;

      try {
        if (patient?.email) {
          await sendAppointmentReminderEmail({
            to: patient.email,
            patientName: patient.name,
            doctorName: doctor?.name,
            date: appt.appointmentDate,
            startTime: appt.startTime,
          });
        }

        // শুধু email পাঠানো (বা কোনো email না থাকা) সফলভাবে
        // শেষ হলেই reminderSent = true হবে।
        appt.reminderSent = true;
        await appt.save();
        sentCount++;
      } catch (err) {
        failedCount++;
        console.error(
          `[reminderJob] Failed to send reminder for appointment ${appt._id}:`,
          err.message
        );
        // reminderSent সেট হচ্ছে না — তাই পরের cron রানে
        // এই appointment এর জন্য আবার চেষ্টা হবে।
      }
    }

    if (appointments.length === 0) {
      console.log("[reminderJob] No appointments need a reminder right now.");
    } else {
      console.log(
        `[reminderJob] Done. Sent: ${sentCount}, Failed: ${failedCount}`
      );
    }
  } catch (err) {
    console.error("[reminderJob] Failed:", err.message);
  }
};

export const startReminderJob = () => {
  // প্রতি ঘণ্টায় একবার চেক করবে (মিনিট ০ এ)
  cron.schedule("0 * * * *", () => {
    console.log("[reminderJob] Running scheduled check...");
    runReminderJob();
  });

  console.log("[reminderJob] Reminder cron job scheduled (hourly)");
};

// ম্যানুয়াল টেস্টের জন্য এক্সপোর্ট করা হলো
export { runReminderJob };