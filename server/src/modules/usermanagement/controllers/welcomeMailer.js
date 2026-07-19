// Welcome email sent to a person whose account was just created (or who was
// granted a notable role). Fire-and-forget — a mail failure must never fail
// the request that triggered it.

const mailSender = require("../../mailsender");

function resolveFrontendBase(req) {
  return (
    (req && req.get && req.get("origin")) ||
    process.env.FRONTEND_URL ||
    "https://xceed.nitj.ac.in"
  );
}

function sendWelcomeEmail({ email, frontendBase, heading, intro, accountCreated }) {
  const resetLink = `${frontendBase}/forgot-password`;
  const loginLink = `${frontendBase}/login`;
  const passwordSection = accountCreated
    ? `<p>Before your first login, set your password here:</p>
       <p><a href="${resetLink}"
             style="display:inline-block;padding:10px 18px;background:#0e7490;color:#ffffff;
                    text-decoration:none;border-radius:6px;font-weight:600;">
         Set your password</a></p>
       <p style="color:#555;">(Enter your email on that page — you will receive an
         OTP to verify it and choose your password.)</p>`
    : `<p>You can log in with your existing password at
         <a href="${loginLink}">${loginLink}</a>. If you have forgotten it, reset it
         at <a href="${resetLink}">${resetLink}</a>.</p>`;
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#222;">
      <h2 style="font-size:16px;">${heading}</h2>
      ${intro}
      ${passwordSection}
      <p style="color:#888;font-size:12px;margin-top:16px;">
        Automated notification from the XCEED platform.
      </p>
    </div>`;
  const subject = `${heading} — XCEED NITJ`;
  Promise.resolve(mailSender(email, subject, html)).catch((err) =>
    console.error("[welcomeMailer] Failed to send email:", err.message),
  );
}

module.exports = { sendWelcomeEmail, resolveFrontendBase };
