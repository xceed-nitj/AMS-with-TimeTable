const nodemailer = require('nodemailer');

const sendMail = async (
  to,
  subject,
  message,
  attachments
) => {
  try {
    const host = process.env.MAIL_HOST || '';
    const port = parseInt(process.env.MAIL_PORT) || 0;  
    const user = process.env.MAIL_USER || '';
    const pass = process.env.MAIL_PASS || '';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: {
        user,
        pass
      }
    });

    let mailOptions = {
      from: `"xceed@nitj.ac.in" <${user}>`,
      to,
      subject,
      html: message,
      attachments: []
    };

    if (attachments !== undefined) {
      mailOptions = { ...mailOptions, attachments };
    }

    await transporter.sendMail(mailOptions);
  } catch (e) {
    throw new Error(e);
  }
};

module.exports = { sendMail };
