// emailTemplates.js
// All HTML email templates for iAMS alert notifications.

function serverDownTemplate(serviceName, details = '') {
  return `
    <h3>⚠️ ${serviceName} is Down</h3>
    <p>The <strong>${serviceName}</strong> service is currently unreachable.</p>
    ${details ? `<p><strong>Details:</strong> ${details}</p>` : ''}
    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    <hr/>
    <p style="color:#888;font-size:12px;">This is an automated alert from iAMS. Do not reply to this email.</p>
  `;
}

function noReportSavedTemplate({ batch, subject, faculty, room, date, timeSlot }) {
  return `
    <h3>⚠️ No Report Saved</h3>
    <p>A scheduled class has no attendance report saved. The camera or recognition system may not have run for this session.</p>
    <table style="border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Batch</td><td><strong>${batch}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Subject</td><td><strong>${subject || 'N/A'}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Faculty</td><td>${faculty || 'N/A'}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Room</td><td>${room || 'N/A'}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Date</td><td>${date}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Time Slot</td><td>${timeSlot}</td></tr>
    </table>
    <p>No attendance report was generated for this scheduled session. Please verify the camera feed and system status.</p>
    <hr/>
    <p style="color:#888;font-size:12px;">This is an automated alert from iAMS. Do not reply to this email.</p>
  `;
}

function classBunkTemplate({ batch, subject, faculty, room, date, timeSlot, totalStudents }) {
  return `
    <h3>🚨 Class Bunked</h3>
    <p>The attendance system ran for this session but <strong>no faces were detected and all students are marked absent</strong>. The entire class may have bunked.</p>
    <table style="border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Batch</td><td><strong>${batch}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Subject</td><td><strong>${subject || 'N/A'}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Faculty</td><td>${faculty || 'N/A'}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Room</td><td>${room || 'N/A'}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Date</td><td>${date}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Time Slot</td><td>${timeSlot}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Total Students</td><td><strong>${totalStudents}</strong> — all absent</td></tr>
    </table>
    <p>No student faces were recognised and no faces appeared in review. This indicates the class was not attended.</p>
    <hr/>
    <p style="color:#888;font-size:12px;">This is an automated alert from iAMS. Do not reply to this email.</p>
  `;
}

function lowConfidenceTemplate({ batch, rollNo, avgConfidence }) {
  return `
    <h3>⚠️ Low Confidence Face Detection</h3>
    <p>A student's face match confidence is below the acceptable threshold.</p>
    <table style="border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Batch</td><td><strong>${batch}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Roll No</td><td><strong>${rollNo}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Avg Confidence</td><td><strong>${(avgConfidence * 100).toFixed(0)}%</strong></td></tr>
    </table>
    <p>This student's ground truth photos may need to be re-captured.</p>
    <hr/>
    <p style="color:#888;font-size:12px;">This is an automated alert from iAMS. Do not reply to this email.</p>
  `;
}

function duplicateAttendanceTemplate({ rollNo, date, sessions }) {
  const sessionList = sessions
    .map(s => `<li>${s.batch} — ${s.timeSlot} — Room: ${s.room || 'N/A'}</li>`)
    .join('');
  return `
    <h3>⚠️ Duplicate Attendance Detected</h3>
    <p>A student has been marked present in multiple sessions at the same time.</p>
    <table style="border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Roll No</td><td><strong>${rollNo}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#888;">Date</td><td>${date}</td></tr>
    </table>
    <p><strong>Sessions:</strong></p>
    <ul>${sessionList}</ul>
    <p>This may indicate a system error or attendance fraud — please investigate.</p>
    <hr/>
    <p style="color:#888;font-size:12px;">This is an automated alert from iAMS. Do not reply to this email.</p>
  `;
}

module.exports = {
  serverDownTemplate,
  noReportSavedTemplate,
  classBunkTemplate,
  lowConfidenceTemplate,
  duplicateAttendanceTemplate,
};
