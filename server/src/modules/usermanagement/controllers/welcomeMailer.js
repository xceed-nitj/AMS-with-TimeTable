// Welcome email sent to a person whose account was just created (or who was
// granted a notable role). Fire-and-forget — a mail failure must never fail
// the request that triggered it.
//
// Visual frame mirrors the forgot-password OTP email (otpbody.ejs) exactly:
// same 480px card, teal "XCEED — NIT Jalandhar" banner, "Dear User,"
// greeting, and footer. Only the design is shared — the message text is the
// caller's own (heading/intro) plus the original password-section wording.

const mailSender = require("../../mailsender");

function resolveFrontendBase(req) {
  return (
    (req && req.get && req.get("origin")) ||
    process.env.FRONTEND_URL ||
    "https://xceed.nitj.ac.in"
  );
}

const P = 'style="margin:0 0 16px;font-size:14px;color:#444;line-height:1.6;"';

function sendWelcomeEmail({ email, frontendBase, heading, intro, accountCreated }) {
  const resetLink = `${frontendBase}/forgot-password`;
  const loginLink = `${frontendBase}/login`;
  const passwordSection = accountCreated
    ? `<p ${P}>Before your first login, set your password here:</p>
       <div style="text-align:center;margin:0 0 20px;">
         <a href="${resetLink}"
            style="display:inline-block;padding:12px 32px;background:#0e7490;color:#ffffff;
                   text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
           Set your password</a>
       </div>
       <p style="margin:0 0 16px;font-size:12px;color:#888;line-height:1.6;">(Enter your email on that page — you will receive an
         OTP to verify it and choose your password.)</p>`
    : `<p ${P}>You can log in with your existing password at
         <a href="${loginLink}" style="color:#0e7490;">${loginLink}</a>. If you have forgotten it, reset it
         at <a href="${resetLink}" style="color:#0e7490;">${resetLink}</a>.</p>`;

  const html = `
<div style="background:#f4f6fb;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e4e8f5;overflow:hidden;">
    <div style="background:#0e7490;padding:20px 28px;">
      <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.02em;">XCEED — NIT Jalandhar</div>
    </div>
    <div style="padding:28px;">
      <h1 style="margin:0 0 12px;font-size:20px;color:#1a1f3c;">${heading}</h1>
      <p style="margin:0 0 8px;font-size:14px;color:#444;line-height:1.6;">Dear User,</p>
      <div style="font-size:14px;color:#444;line-height:1.6;">
        ${intro}
      </div>
      ${passwordSection}
    </div>
    <div style="padding:14px 28px;border-top:1px solid #e4e8f5;background:#fafbfe;">
      <span style="font-size:11px;color:#999;">Automated email from the XCEED platform — please do not reply.</span>
    </div>
  </div>
</div>`;

  const subject = `${heading} — XCEED NITJ`;
  Promise.resolve(mailSender(email, subject, html)).catch((err) =>
    console.error("[welcomeMailer] Failed to send email:", err.message),
  );
}

module.exports = { sendWelcomeEmail, resolveFrontendBase };
