const nodemailer = require('nodemailer');
const os = require('os');

const sendReviewerMail = async (
  to,
  subject,
  message,
  attachments
) => {
  try {
    const hostName = os.hostname();
    const reviewAcceptanceURL = `http://localhost:5173/prm/reviewerAcceptance` || 'https://xceed.nitj.ac.in/prm/reviewerAcceptance' || 'https://nitjtt.onrender.com/prm/reviewerAcceptance';
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
      from: `"Xceed" <${user}>`,
      to,
      subject,
      html: `${message}<br><br>Please click <a href="${reviewAcceptanceURL}">here</a> to access the ReviewerAcceptance page.`,
      attachments: []
    };

    if (attachments !== undefined) {
      mailOptions.attachments = attachments;
    }

    await transporter.sendMail(mailOptions);
  } catch (e) {
    throw new Error(e);
  }
};

module.exports = { sendReviewerMail };
