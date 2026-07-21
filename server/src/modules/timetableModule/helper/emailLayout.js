/**
 * Shared colorful email layout for the Timetable module.
 *
 * Wraps arbitrary inner HTML in the same card / banner / footer styling used by
 * the OTP email (see usermanagement/controllers/otpbody.ejs) so every timetable
 * notification shares one consistent, colorful look.
 *
 * @param {Object}  opts
 * @param {string}  opts.title       Heading shown at the top of the card body.
 * @param {string}  opts.bodyHtml    Inner HTML for the message body.
 * @param {string} [opts.accent]     Accent / banner colour (defaults to teal).
 * @returns {string} Full HTML email body.
 */
function renderTimetableEmail({ title, bodyHtml, accent = "#0e7490" }) {
  return `
<div style="background:#f4f6fb;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e4e8f5;overflow:hidden;">
    <div style="background:${accent};padding:22px 28px;">
      <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:.02em;">${title}</div>
      <div style="color:rgba(255,255,255,.85);font-size:12px;margin-top:4px;">XCEED — NIT Jalandhar</div>
    </div>
    <div style="padding:28px;">
      ${bodyHtml}
    </div>
    <div style="padding:14px 28px;border-top:1px solid #e4e8f5;background:#fafbfe;">
      <span style="font-size:11px;color:#999;">Automated email from the XCEED platform — please do not reply.</span>
    </div>
  </div>
</div>`;
}

/** Primary call-to-action button. */
function emailButton(url, label, color = "#0e7490") {
  return `
      <div style="text-align:center;margin:24px 0;">
        <a href="${url}" target="_blank"
           style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;">
          ${label}
        </a>
      </div>`;
}

/**
 * Coloured section card used to group related content (e.g. added / removed
 * subjects) with a soft tinted background and a left accent bar.
 */
function emailSection({ heading, bg, border, headingColor, contentHtml }) {
  return `
      <div style="background:${bg};border:1px solid ${border};border-left:4px solid ${headingColor};border-radius:10px;padding:14px 18px;margin:0 0 16px;">
        <div style="font-size:14px;font-weight:700;color:${headingColor};margin:0 0 8px;">${heading}</div>
        ${contentHtml}
      </div>`;
}

module.exports = { renderTimetableEmail, emailButton, emailSection };
