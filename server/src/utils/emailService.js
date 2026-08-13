import nodemailer from "nodemailer";

let transporter = null;

// Transporter টা module load হওয়ার সময় না বানিয়ে,
// প্রথম ব্যবহারের সময় বানানো হচ্ছে — এতে নিশ্চিত হয়
// dotenv.config() ততক্ষণে চলে গেছে এবং env variables রেডি।
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
};

export const sendAppointmentReminderEmail = async ({
  to,
  patientName,
  doctorName,
  date,
  startTime,
}) => {
  if (!to) return;

  // এখানে ইচ্ছাকৃতভাবে try/catch নেই।
  // Error হলে সেটা caller (reminderJob.js) পর্যন্ত throw হয়ে যাবে,
  // যাতে caller জানতে পারে email আসলে পাঠানো গেছে কিনা,
  // এবং সেই অনুযায়ী reminderSent সেট করবে কি করবে না তা ঠিক করতে পারে।
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Appointment Reminder — ${date} at ${startTime}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px;">
        <h2 style="color:#2454c7;">MediSchedule</h2>
        <p>Hi ${patientName || "there"},</p>
        <p>This is a reminder for your upcoming appointment:</p>
        <table style="border-collapse: collapse; margin: 12px 0;">
          <tr><td style="padding:4px 12px 4px 0;"><b>Doctor</b></td><td>${doctorName || "N/A"}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;"><b>Date</b></td><td>${date}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;"><b>Time</b></td><td>${startTime}</td></tr>
        </table>
        <p>Please arrive a few minutes early. If you need to cancel or reschedule, please do so from your dashboard.</p>
        <p style="color:#71809b; font-size: 13px;">— MediSchedule Team</p>
      </div>
    `,
  });

  console.log(`[emailService] Reminder email sent to ${to}`);
};