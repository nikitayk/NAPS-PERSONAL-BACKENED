const nodemailer = require('nodemailer');
const config = require('../config/config');

// Create transporter using SMTP configuration from environment variables
const transporter = nodemailer.createTransport({
  host: config.email.smtpHost || 'smtp.mailtrap.io',
  port: config.email.smtpPort || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.email.smtpUser,
    pass: config.email.smtpPass,
  },
});

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content
 */
async function sendEmail({ to, subject, text, html }) {
  const mailOptions = {
    from: config.email.fromAddress,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = { sendEmail };
