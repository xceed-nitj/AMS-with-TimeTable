/**
 * One-off script: render the certificate participant email and the attendance
 * (iAMS) alert emails with sample data and send them to a target address to
 * preview the new colorful layout.
 *   node scripts/sendSampleCertAndAttendanceEmails.js [email]
 */
require("dotenv").config();

const path = require("path");
const ejs = require("ejs");
const mailSender = require("../src/modules/mailsender");
const templates = require("../src/modules/attendanceModule/controllers/emailTemplates");

const TARGET = process.argv[2] || "harimur@gmail.com";

async function send(subject, html) {
  const info = await mailSender(TARGET, subject, html);
  console.log("  sent:", subject, "->", info && info.messageId ? info.messageId : info);
}

(async () => {
  console.log("Sending sample certificate + attendance emails to:", TARGET);

  // ---- Certificate module (email.ejs) ----
  const certTemplatePath = path.join(
    __dirname,
    "../src/modules/certificateModule/controllers/email.ejs"
  );
  const certHtml = await ejs.renderFile(certTemplatePath, {
    participantName: "Dr. A. Sharma",
    eventName: "International Conference on AI & Data Science 2026",
    certificateURL: "https://xceed.nitj.ac.in/cm/c/EVENT123/PARTICIPANT456",
  });
  await send("[SAMPLE] International Conference on AI & Data Science 2026: Your certificate is here!", certHtml);

  // ---- Attendance module (emailTemplates.js) ----
  await send(
    "[SAMPLE] ⚠️ ERP Server is Down",
    templates.serverDownTemplate("ERP Server", "Connection timed out after 30s")
  );

  await send(
    "[SAMPLE] ✅ ERP Server is Back Up",
    templates.serverRecoveredTemplate("ERP Server")
  );

  await send(
    "[SAMPLE] ⚠️ iAMS Alert: No report saved — Machine Learning",
    templates.noReportSavedTemplate({
      batch: "CSE 2022-26",
      subject: "Machine Learning",
      faculty: "Dr. A. Sharma",
      room: "CS-201",
      date: "21 Jul 2026",
      timeSlot: "09:00 - 10:00",
    })
  );

  await send(
    "[SAMPLE] 🚨 iAMS Alert: Class bunked — Operating Systems",
    templates.classBunkTemplate({
      batch: "CSE 2023-27",
      subject: "Operating Systems",
      faculty: "Dr. R. Verma",
      room: "CS-110",
      date: "21 Jul 2026",
      timeSlot: "11:00 - 12:00",
      totalStudents: 62,
    })
  );

  await send(
    "[SAMPLE] ⚠️ iAMS Alert: Low confidence face detection",
    templates.lowConfidenceTemplate({
      batch: "CSE 2022-26",
      rollNo: "21103045",
      avgConfidence: 0.42,
    })
  );

  await send(
    "[SAMPLE] ⚠️ iAMS Alert: Duplicate attendance detected",
    templates.duplicateAttendanceTemplate({
      rollNo: "21103045",
      date: "21 Jul 2026",
      sessions: [
        { batch: "CSE 2022-26", timeSlot: "09:00 - 10:00", room: "CS-201" },
        { batch: "ECE 2022-26", timeSlot: "09:00 - 10:00", room: "EC-105" },
      ],
    })
  );

  await send(
    "[SAMPLE] 📊 Daily Attendance Summary — CSE",
    templates.dailySummaryTemplate({
      dept: "CSE",
      date: "21 Jul 2026",
      frequencyLabel: "daily",
      mode: "threshold",
      threshold: 75,
      rows: [
        { semester: "6", subject: "Machine Learning", faculty: "Dr. A. Sharma", period: "P1", room: "CS-201", present: 40, totalStudents: 62, attendancePct: 65 },
        { semester: "6", subject: "Computer Networks", faculty: "Dr. S. Rao", period: "P3", room: "CS-203", present: 45, totalStudents: 62, attendancePct: 73 },
        { semester: "4", subject: "DBMS", faculty: "Dr. P. Nair", period: "P2", room: "CS-105", present: 30, totalStudents: 58, attendancePct: 52 },
      ],
    })
  );

  await send(
    "[SAMPLE] 📸 Weekly Embedding/Ground-Truth Progress — CSE",
    templates.embeddingProgressTemplate({
      dept: "CSE",
      semesterGroups: [
        {
          sem: "6",
          rows: [
            { subject: "Machine Learning", faculty: "Dr. A. Sharma", submitted: 62, groundTruthReady: 62, missing: 0, status: "Completed" },
            { subject: "Computer Networks", faculty: "Dr. S. Rao", submitted: 40, groundTruthReady: 20, missing: 22, status: "Pending" },
          ],
        },
        {
          sem: "4",
          rows: [
            { subject: "DBMS", faculty: "Dr. P. Nair", submitted: 0, groundTruthReady: 0, missing: 58, status: "Not Started" },
          ],
        },
      ],
    })
  );

  await send(
    "[SAMPLE] ⚠️ Scheduled Status Check — Service(s) Down",
    templates.uptimeDigestTemplate({
      checkedAt: "21 Jul 2026, 08:30 IST",
      results: [
        { name: "iAMS API", target: "https://api.xceed.nitj.ac.in", status: "up", error: "" },
        { name: "ERP Server", target: "https://erp.nitj.ac.in", status: "down", error: "Connection timed out" },
        { name: "Camera Feed", target: "", status: "not_configured", error: "" },
      ],
    })
  );

  console.log("Done.");
  process.exit(0);
})().catch((e) => {
  console.error("Failed to send sample emails:", e);
  process.exit(1);
});
