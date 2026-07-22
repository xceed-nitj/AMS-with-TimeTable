// emailTemplates.js
// All HTML email templates for iLEED alert notifications.
//
// Every template is wrapped in a shared colorful card layout (banner + body +
// footer) that mirrors the OTP email and the other XCEED modules
// (timetableModule/helper/emailLayout.js), so all iLEED notifications share
// one consistent look. Accent colour is chosen per template by severity:
//   red  #dc2626  → outages / bunks / critical alerts
//   amber #d97706 → warnings needing attention
//   green #16a34a → recoveries / healthy
//   teal  #0e7490 → informational digests & summaries

// ---- Shared style tokens ----
const P = "margin:0 0 16px;font-size:14px;color:#444;line-height:1.6;";
const TABLE = "border-collapse:collapse;font-size:14px;width:100%;margin:0 0 16px;";
const TH =
  "padding:8px 12px;text-align:left;background:#f0f4fa;color:#5b6472;font-size:12px;font-weight:700;border-bottom:2px solid #e4e8f5;";
const TD =
  "padding:8px 12px;border-bottom:1px solid #eef1f7;font-size:13px;color:#1a1f3c;";

// The iLEED wordmark, email-safe: serif italic "i" + bold "LEED" (Georgia /
// Times fall back to the same style family as the frontend's STIX wordmark —
// web fonts are unreliable in email clients, so we use the stack every
// client ships with).
const ILEED_MARK =
  `<span style="font-family:Georgia,'Times New Roman',serif;"><i>i</i><b>LEED</b></span>`;
const ILEED_FULL_FORM = "Intelligent Learning Engagement and Entity Detection";

/**
 * Wrap inner HTML in the colorful iLEED email card.
 * @param {string} title    Heading shown at the top of the card body.
 * @param {string} accent   Banner / accent colour.
 * @param {string} bodyHtml Inner HTML for the message body.
 */
function renderAlert({ title, accent = "#0e7490", bodyHtml }) {
  return `
<div style="background:#f4f6fb;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e4e8f5;overflow:hidden;">
    <div style="background:${accent};padding:22px 28px;">
      <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:.02em;">${title}</div>
      <div style="color:rgba(255,255,255,.85);font-size:12px;margin-top:4px;">${ILEED_MARK} — ${ILEED_FULL_FORM} · NIT Jalandhar</div>
    </div>
    <div style="padding:28px;">
      ${bodyHtml}
    </div>
    <div style="padding:14px 28px;border-top:1px solid #e4e8f5;background:#fafbfe;">
      <span style="font-size:11px;color:#999;">This is an automated alert from ${ILEED_MARK} on the XCEED platform — please do not reply.</span>
    </div>
  </div>
</div>`;
}

/**
 * A tinted key/value card with an accent bar on the left.
 * @param {string} accent
 * @param {Array<[string, string]>} rows  [label, value] pairs.
 */
function infoCard(accent, rows) {
  const trs = rows
    .map(
      ([k, v]) => `
        <tr>
          <td style="padding:6px 16px 6px 0;color:#888;font-size:13px;white-space:nowrap;vertical-align:top;">${k}</td>
          <td style="padding:6px 0;font-size:14px;color:#1a1f3c;">${v}</td>
        </tr>`,
    )
    .join("");
  return `
      <div style="background:#f7f9fc;border:1px solid #e4e8f5;border-left:4px solid ${accent};border-radius:10px;padding:8px 18px;margin:0 0 16px;">
        <table style="border-collapse:collapse;width:100%;">${trs}</table>
      </div>`;
}

function serverDownTemplate(serviceName, details = "") {
  const body = `
      <p style="${P}">The <strong style="color:#dc2626;">${serviceName}</strong> service is currently unreachable.</p>
      ${infoCard(
        "#dc2626",
        [
          ...(details ? [["Details", details]] : []),
          ["Time", new Date().toLocaleString()],
        ],
      )}`;
  return renderAlert({
    title: `⚠️ ${serviceName} is Down`,
    accent: "#dc2626",
    bodyHtml: body,
  });
}

function serverRecoveredTemplate(serviceName) {
  const body = `
      <p style="${P}">The <strong style="color:#16a34a;">${serviceName}</strong> service is reachable again and has recovered.</p>
      ${infoCard("#16a34a", [["Time", new Date().toLocaleString()]])}`;
  return renderAlert({
    title: `✅ ${serviceName} is Back Up`,
    accent: "#16a34a",
    bodyHtml: body,
  });
}

function noReportSavedTemplate({ batch, subject, faculty, room, date, timeSlot }) {
  const body = `
      <p style="${P}">A scheduled class has no attendance report saved. The camera or recognition system may not have run for this session.</p>
      ${infoCard("#d97706", [
        ["Batch", `<strong>${batch}</strong>`],
        ["Subject", `<strong>${subject || "N/A"}</strong>`],
        ["Faculty", faculty || "N/A"],
        ["Room", room || "N/A"],
        ["Date", date],
        ["Time Slot", timeSlot],
      ])}
      <p style="${P}">No attendance report was generated for this scheduled session. Please verify the camera feed and system status.</p>`;
  return renderAlert({
    title: "⚠️ No Report Saved",
    accent: "#d97706",
    bodyHtml: body,
  });
}

function classBunkTemplate({ batch, subject, faculty, room, date, timeSlot, totalStudents }) {
  const body = `
      <p style="${P}">The attendance system ran for this session but <strong>no faces were detected and all students are marked absent</strong>. The entire class may have bunked.</p>
      ${infoCard("#dc2626", [
        ["Batch", `<strong>${batch}</strong>`],
        ["Subject", `<strong>${subject || "N/A"}</strong>`],
        ["Faculty", faculty || "N/A"],
        ["Room", room || "N/A"],
        ["Date", date],
        ["Time Slot", timeSlot],
        ["Total Students", `<strong>${totalStudents}</strong> — all absent`],
      ])}
      <p style="${P}">No student faces were recognised and no faces appeared in review. This indicates the class was not attended.</p>`;
  return renderAlert({
    title: "🚨 Class Bunked",
    accent: "#dc2626",
    bodyHtml: body,
  });
}

function lowConfidenceTemplate({ batch, rollNo, avgConfidence }) {
  const body = `
      <p style="${P}">A student's face match confidence is below the acceptable threshold.</p>
      ${infoCard("#d97706", [
        ["Batch", `<strong>${batch}</strong>`],
        ["Roll No", `<strong>${rollNo}</strong>`],
        ["Avg Confidence", `<strong>${(avgConfidence * 100).toFixed(0)}%</strong>`],
      ])}
      <p style="${P}">This student's ground truth photos may need to be re-captured.</p>`;
  return renderAlert({
    title: "⚠️ Low Confidence Face Detection",
    accent: "#d97706",
    bodyHtml: body,
  });
}

function duplicateAttendanceTemplate({ rollNo, date, sessions }) {
  const sessionList = sessions
    .map(
      (s) =>
        `<li style="margin:2px 0;">${s.batch} — ${s.timeSlot} — Room: ${s.room || "N/A"}</li>`,
    )
    .join("");
  const body = `
      <p style="${P}">A student has been marked present in multiple sessions at the same time.</p>
      ${infoCard("#d97706", [
        ["Roll No", `<strong>${rollNo}</strong>`],
        ["Date", date],
      ])}
      <p style="margin:0 0 6px;font-size:14px;color:#444;"><strong>Sessions:</strong></p>
      <ul style="margin:0 0 16px;padding-left:18px;font-size:14px;color:#444;line-height:1.7;">${sessionList}</ul>
      <p style="${P}">This may indicate a system error or attendance fraud — please investigate.</p>`;
  return renderAlert({
    title: "⚠️ Duplicate Attendance Detected",
    accent: "#d97706",
    bodyHtml: body,
  });
}

function dailySummaryTemplate({ dept, date, frequencyLabel, mode, threshold, rows }) {
  // Group by semester — one table per semester in the email body, rather
  // than a single table with a Batch column.
  const bySemester = {};
  for (const r of rows) {
    const sem = r.semester || "Unknown";
    if (!bySemester[sem]) bySemester[sem] = [];
    bySemester[sem].push(r);
  }
  const semesters = Object.keys(bySemester).sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { numeric: true }),
  );

  const tablesHtml = semesters
    .map((sem) => {
      // Sorted by period so a subject taught multiple times in the range
      // reads as distinct chronological rows — never averaged together.
      const sortedRows = [...bySemester[sem]].sort((a, b) =>
        String(a.period || "").localeCompare(String(b.period || "")),
      );
      const rowsHtml = sortedRows
        .map(
          (r) => `
      <tr>
        <td style="${TD}">${r.subject || "N/A"}</td>
        <td style="${TD}">${r.faculty || "N/A"}</td>
        <td style="${TD}">${r.period || "N/A"}</td>
        <td style="${TD}">${r.room || "N/A"}</td>
        <td style="${TD}">${r.present}/${r.totalStudents}</td>
        <td style="${TD}"><strong>${r.attendancePct}%</strong></td>
      </tr>`,
        )
        .join("");

      return `
    <h4 style="margin:18px 0 6px;color:#0e7490;">Semester ${sem}</h4>
    <table style="${TABLE}">
      <thead>
        <tr>
          <th style="${TH}">Subject</th>
          <th style="${TH}">Faculty</th>
          <th style="${TH}">Period</th>
          <th style="${TH}">Room</th>
          <th style="${TH}">Present</th>
          <th style="${TH}">%</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>`;
    })
    .join("");

  const introText =
    mode === "threshold"
      ? `The following classes in <strong>${dept}</strong> had attendance below <strong>${threshold}%</strong> for this ${frequencyLabel === "weekly" ? "week" : "day"}.`
      : `Attendance summary for all classes in <strong>${dept}</strong> for this ${frequencyLabel === "weekly" ? "week" : "day"}.`;

  const body = `
      <p style="${P}">${introText}</p>
      ${tablesHtml}
      <p style="margin:16px 0 0;color:#888;font-size:12px;">Report date: ${date}</p>`;
  return renderAlert({
    title: `📊 ${frequencyLabel === "weekly" ? "Weekly" : "Daily"} Attendance Summary — ${dept}`,
    accent: "#0e7490",
    bodyHtml: body,
  });
}

const STATUS_COLORS = {
  Completed: "#16a34a",
  Pending: "#d97706",
  "Not Started": "#dc2626",
};

function embeddingProgressTemplate({ dept, semesterGroups }) {
  const tablesHtml = semesterGroups
    .map(({ sem, rows }) => {
      const rowsHtml = rows
        .map((r) => {
          const color = STATUS_COLORS[r.status] || "#888";
          return `
      <tr>
        <td style="${TD}">${r.subject || "N/A"}</td>
        <td style="${TD}">${r.faculty || "N/A"}</td>
        <td style="${TD}">${r.submitted ?? "—"}</td>
        <td style="${TD}">${r.groundTruthReady ?? "—"}</td>
        <td style="${TD}">${r.missing ?? "—"}</td>
        <td style="${TD}"><strong style="color:${color};">${r.status}</strong></td>
      </tr>`;
        })
        .join("");

      return `
    <h4 style="margin:18px 0 6px;color:#0e7490;">Semester ${sem}</h4>
    <table style="${TABLE}">
      <thead>
        <tr>
          <th style="${TH}">Subject</th>
          <th style="${TH}">Faculty</th>
          <th style="${TH}">Submitted</th>
          <th style="${TH}">Ground Truth Ready</th>
          <th style="${TH}">Missing</th>
          <th style="${TH}">Status</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>`;
    })
    .join("");

  const body = `
      <p style="${P}">Per-subject embedding status across all semesters in <strong>${dept}</strong>, as of this week. "Not Started" means no roll numbers have been submitted for that subject yet.</p>
      ${tablesHtml}`;
  return renderAlert({
    title: `📸 Weekly Embedding/Ground-Truth Progress — ${dept}`,
    accent: "#0e7490",
    bodyHtml: body,
  });
}

// Scheduled uptime digest (8:30 / 13:30 IST on working days) — one table
// covering every probed service, unlike serverDownTemplate which is a single
// transition alert for one service. `results` rows: { name, target, status
// ('up'|'down'|'not_configured'), error }.
function uptimeDigestTemplate({ checkedAt, results }) {
  const rowsHtml = results
    .map((r) => {
      const statusHtml =
        r.status === "up"
          ? '<strong style="color:#16a34a;">✅ Online</strong>'
          : r.status === "not_configured"
            ? '<span style="color:#888;">Not configured</span>'
            : '<strong style="color:#dc2626;">⚠️ DOWN</strong>';
      return `
      <tr>
        <td style="${TD}"><strong>${r.name}</strong></td>
        <td style="${TD}">${r.target || "—"}</td>
        <td style="${TD}">${statusHtml}</td>
        <td style="${TD}color:#888;">${r.error || ""}</td>
      </tr>`;
    })
    .join("");

  const body = `
      <p style="${P}">The twice-daily scheduled status check (8:30 AM / 1:30 PM on working days) found one or more services unreachable.</p>
      <table style="${TABLE}">
        <thead>
          <tr>
            <th style="${TH}">Service</th>
            <th style="${TH}">Target</th>
            <th style="${TH}">Status</th>
            <th style="${TH}">Details</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <p style="margin:0;font-size:14px;color:#444;"><strong>Checked at:</strong> ${checkedAt}</p>`;
  return renderAlert({
    title: "⚠️ Scheduled Status Check — Service(s) Down",
    accent: "#dc2626",
    bodyHtml: body,
  });
}

module.exports = {
  serverDownTemplate,
  serverRecoveredTemplate,
  noReportSavedTemplate,
  classBunkTemplate,
  lowConfidenceTemplate,
  duplicateAttendanceTemplate,
  dailySummaryTemplate,
  embeddingProgressTemplate,
  uptimeDigestTemplate,
};
