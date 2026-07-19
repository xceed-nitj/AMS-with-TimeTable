// Sends administrative notification emails (new user created / role added)
// to the platform admin mailbox. Fire-and-forget: failures are logged and
// never block or fail the request that triggered the notification.

const mailSender = require("../../mailsender");

const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "xceed@nitj.ac.in";

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));

const userEmail = (user) =>
  Array.isArray(user.email) ? user.email.join(", ") : String(user.email || "");

const detailRow = (label, value) =>
  `<tr><td style="padding:4px 12px 4px 0;color:#555;">${label}</td>` +
  `<td style="padding:4px 0;font-weight:600;">${escapeHtml(value) || "—"}</td></tr>`;

function sendAdminNotification(subject, heading, rows) {
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#222;">
      <h2 style="font-size:16px;">${escapeHtml(heading)}</h2>
      <table style="border-collapse:collapse;">${rows.join("")}</table>
      <p style="color:#888;font-size:12px;margin-top:16px;">
        Automated notification from the XCEED platform.
      </p>
    </div>`;
  Promise.resolve(mailSender(ADMIN_NOTIFY_EMAIL, subject, html)).catch((err) =>
    console.error("[adminNotifier] Failed to send notification:", err.message),
  );
}

function notifyUserCreated(user) {
  sendAdminNotification(
    `New user created: ${userEmail(user)}`,
    "A new user account was created",
    [
      detailRow("Email", userEmail(user)),
      detailRow("Roles", (user.role || []).join(", ")),
      detailRow("Department", user.dept),
      detailRow("Created at", new Date().toISOString()),
    ],
  );
}

function notifyRoleAdded(user, role) {
  sendAdminNotification(
    `Role added: ${role} → ${userEmail(user)}`,
    "A role was added to an existing user",
    [
      detailRow("Email", userEmail(user)),
      detailRow("Role added", role),
      detailRow("All roles", (user.role || []).join(", ")),
      detailRow("Department", user.dept),
      detailRow("Added at", new Date().toISOString()),
    ],
  );
}

module.exports = { notifyUserCreated, notifyRoleAdded, ADMIN_NOTIFY_EMAIL };
