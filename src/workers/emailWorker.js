const { processJob } = require("../utils/scheduler");
const nodemailer = require("nodemailer");

// Configure your email transporter (e.g., Gmail, SMTP, etc.)
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email provider or custom SMTP settings
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});

/**
 * Send an email
 * @param {Object} mailOptions - The email details
 * @param {string} mailOptions.to - Recipient email address
 * @param {string} mailOptions.subject - Email subject
 * @param {string} mailOptions.text - Plain text body
 * @param {string} [mailOptions.html] - HTML body (optional)
 * @returns {Promise}
 */
async function sendEmail(mailOptions) {
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${mailOptions.to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// Define the job processor for the "sendEmail" job
processJob("sendEmail", async (job) => {
  const { to, subject, text, html } = job.data;
  console.log("Processing email job:", job.data);

  // Call the sendEmail function
  await sendEmail({ to, subject, text, html });
});

module.exports = { sendEmail };
