/**
 * One-off script: send a sample of the redesigned iLEED daily attendance
 * summary — the notification department-registered users receive — to a
 * target address to preview the new branding/layout.
 *   node scripts/sendSampleDeptSummaryEmail.js [email]
 */
require("dotenv").config();

const mailSender = require("../src/modules/mailsender");
const templates = require("../src/modules/attendanceModule/controllers/emailTemplates");

const TARGET = process.argv[2] || "harimur@gmail.com";

(async () => {
  console.log("Sending sample iLEED dept summary email to:", TARGET);

  const html = templates.dailySummaryTemplate({
    dept: "CSE",
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    frequencyLabel: "daily",
    mode: "all",
    threshold: null,
    rows: [
      { semester: "4", subject: "Operating Systems",   faculty: "Dr. R. Verma",  period: "P1 09:00-10:00", room: "CS-110", present: 54, totalStudents: 62, attendancePct: 87 },
      { semester: "4", subject: "Database Systems",    faculty: "Dr. S. Gupta",  period: "P3 11:00-12:00", room: "CS-201", present: 48, totalStudents: 62, attendancePct: 77 },
      { semester: "6", subject: "Machine Learning",    faculty: "Dr. A. Sharma", period: "P2 10:00-11:00", room: "CS-305", present: 41, totalStudents: 58, attendancePct: 71 },
      { semester: "6", subject: "Computer Networks",   faculty: "Dr. P. Singh",  period: "P4 12:00-13:00", room: "CS-202", present: 52, totalStudents: 58, attendancePct: 90 },
    ],
  });

  const info = await mailSender(
    TARGET,
    "[SAMPLE] 📊 iLEED Daily Attendance Summary — CSE",
    html,
  );
  console.log("sent:", info && info.messageId ? info.messageId : info);
})();
