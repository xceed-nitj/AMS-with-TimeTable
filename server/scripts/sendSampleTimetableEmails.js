/**
 * One-off script: render the two timetable-module notification emails with
 * sample data and send them to a target address to preview the new colorful
 * layout. Run from the `server` directory:  node scripts/sendSampleTimetableEmails.js
 */
require("dotenv").config();

const {
  renderTimetableEmail,
  emailButton,
  emailSection,
} = require("../src/modules/timetableModule/helper/emailLayout");
const mailSender = require("../src/modules/mailsender");

const TARGET = process.argv[2] || "harimur@gmail.com";
const SAMPLE_URL = "https://xceed.nitj.ac.in/timetable/faculty/SAMPLE123";

// ---- 1. "Timetable Published" sample ----
function publishedEmail() {
  const bodyHtml = `
      <p style="margin:0 0 8px;font-size:14px;color:#444;line-height:1.6;">Dear Dr. A. Sharma,</p>
      <p style="margin:0 0 16px;font-size:14px;color:#444;line-height:1.6;">
        We are pleased to inform you that the timetable for the
        <strong style="color:#0e7490;">Computer Science &amp; Engineering</strong> department for the upcoming academic
        session <strong style="color:#0e7490;">2025-26 (Odd)</strong> has been published.
      </p>
      <div style="background:#f0f9ff;border:1px solid #cfe9f5;border-left:4px solid #0e7490;border-radius:10px;padding:14px 18px;margin:0 0 8px;">
        <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">
          Your personalised timetable is now ready. Tap the button below to view it.
        </p>
      </div>
      ${emailButton(SAMPLE_URL, "View Timetable")}
      <p style="margin:0 0 16px;font-size:12px;color:#888;line-height:1.6;">
        This is an auto-generated email. For any clarifications, kindly contact the
        timetable coordinator.
      </p>
      <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">
        Regards,<br />
        <strong style="color:#0e7490;">Team XCEED</strong>
      </p>`;
  return renderTimetableEmail({ title: "Timetable Published", bodyHtml });
}

// ---- 2. "Timetable Update Notification" sample ----
function updateEmail() {
  const listStyle =
    "margin:6px 0 0;padding-left:18px;font-size:14px;color:#444;line-height:1.7;";

  let bodyHtml = `
      <p style="margin:0 0 8px;font-size:14px;color:#444;line-height:1.6;">Dear Dr. A. Sharma,</p>
      <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6;">
        This email is to notify you of updates to your teaching timetable.
        Please review the changes below:
      </p>`;

  bodyHtml += emailSection({
    heading: "🟢 New Subjects Assigned",
    bg: "#effaf3",
    border: "#c7ecd4",
    headingColor: "#16a34a",
    contentHtml: `<ul style="${listStyle}"><li><strong>Machine Learning (Sem 6)</strong><ul style="${listStyle}"><li>Monday, 09:00-10:00 | Room: CS-201</li><li>Wednesday, 11:00-12:00 | Room: CS-201</li></ul></li></ul>`,
  });

  bodyHtml += emailSection({
    heading: "🔴 Subjects Removed",
    bg: "#fef2f2",
    border: "#f6cccc",
    headingColor: "#dc2626",
    contentHtml: `<ul style="${listStyle}"><li><strong>Data Structures (Sem 3)</strong></li></ul>`,
  });

  bodyHtml += emailSection({
    heading: "🟡 Subject Updates",
    bg: "#fffbeb",
    border: "#f5e6b3",
    headingColor: "#d97706",
    contentHtml: `<ul style="${listStyle}"><li><strong>Operating Systems (Sem 5)</strong><ul style="${listStyle}"><li>Room Changed: From CS-105 to CS-110</li><li>Slot Changes:<ul style="${listStyle}"><li>Added: Friday, 14:00-15:00</li><li>Removed: Tuesday, 10:00-11:00</li></ul></li></ul></li></ul>`,
  });

  bodyHtml += emailButton(SAMPLE_URL, "View Updated Timetable");
  bodyHtml += `
      <p style="margin:0 0 16px;font-size:12px;color:#888;line-height:1.6;">
        This is an auto-generated email. If you have any questions, please contact
        the department timetable coordinator.
      </p>
      <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">
        Regards,<br />
        <strong style="color:#0e7490;">Team XCEED</strong>
      </p>`;

  return renderTimetableEmail({
    title: "Timetable Update Notification",
    bodyHtml,
  });
}

(async () => {
  console.log("Sending sample timetable emails to:", TARGET);

  const r1 = await mailSender(
    TARGET,
    "[SAMPLE] Timetable Published for the Upcoming Session",
    publishedEmail()
  );
  console.log("Published email ->", r1 && r1.messageId ? r1.messageId : r1);

  const r2 = await mailSender(
    TARGET,
    "[SAMPLE] Timetable Update Notification",
    updateEmail()
  );
  console.log("Update email ->", r2 && r2.messageId ? r2.messageId : r2);

  console.log("Done.");
  process.exit(0);
})().catch((e) => {
  console.error("Failed to send sample emails:", e);
  process.exit(1);
});
