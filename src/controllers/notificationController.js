const { addJob } = require("../utils/scheduler");

async function sendNotificationEmail(req, res) {
  const { email, subject, message } = req.body;

  // Add an email-sending job to the queue
  await addJob("sendEmail", {
    to: email,
    subject,
    text: message,
  });

  res.status(200).json({ success: true, message: "Email job added to queue" });
}
