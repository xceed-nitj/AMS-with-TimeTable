/**
 * One-off script: send samples of the role-addition / account-created emails
 * (welcomeMailer.js, OTP-page design) to a target address.
 *   node scripts/sendSampleRoleEmail.js [email]
 */
require("dotenv").config();

const { sendWelcomeEmail } = require("../src/modules/usermanagement/controllers/welcomeMailer");

const TARGET = process.argv[2] || "harimur@gmail.com";
const BASE = process.env.FRONTEND_URL || "https://xceed.nitj.ac.in";

console.log("Sending sample role-addition emails to:", TARGET);

// Dept-admin role assigned to an existing account
sendWelcomeEmail({
  email: TARGET,
  frontendBase: BASE,
  heading: "[SAMPLE] You are now an iLEED Department Admin",
  intro: `<p>You have been assigned as the <strong>iLEED Department Admin</strong>
            (Intelligent Learning Engagement and Entity Detection) for
            <strong>CSE</strong> on the XCEED platform (NIT Jalandhar).</p>`,
  accountCreated: false,
});

// Role assigned + account newly created (shows the set-password button)
sendWelcomeEmail({
  email: TARGET,
  frontendBase: BASE,
  heading: "[SAMPLE] Your XCEED account has been created",
  intro: `<p>An account has been created for this email address on the
            XCEED platform (NIT Jalandhar) with the role(s):
            <strong>iams-dept-admin</strong>.</p>`,
  accountCreated: true,
});

// sendWelcomeEmail is fire-and-forget; give the SMTP sends time to complete.
setTimeout(() => console.log("done"), 8000);
