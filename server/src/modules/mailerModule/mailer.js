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
      secure: port === 465, // true for port 465, false for other ports
      auth: {
        user,
        pass
      },
      // Increased timeout settings
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000,     // 60 seconds
      // TLS configuration for better compatibility
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates
        minVersion: 'TLSv1.2'
      },
      // Additional options for stability
      pool: true,
      maxConnections: 5,
      maxMessages: 10,
      requireTLS: port === 587, // Require TLS for port 587
      logger: process.env.NODE_ENV === 'development', // Enable logging in dev
      debug: process.env.NODE_ENV === 'development'   // Enable debug in dev
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

    // Verify connection before sending
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    return info;
  } catch (e) {
    console.error('Email sending error:', e.message);
    throw new Error(`Failed to send email: ${e.message}`);
  }
};

module.exports = { sendMail };