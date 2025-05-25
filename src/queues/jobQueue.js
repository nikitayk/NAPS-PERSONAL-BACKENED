const { addJob, processJob } = require("../utils/scheduler");

// Add a job
addJob("sendEmail", { userId: "123" }, { attempts: 3, backoff: 5000 });

// Process the job
processJob("sendEmail", async (job) => {
  console.log("Processing job data:", job.data);
  // Your email sending logic here
});



const Bull = require("bull");

// Example: Queue to process email sending tasks
const emailQueue = new Bull("emailQueue", {
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
});

// Example: Queue to process payment verification or heavy tasks
const paymentQueue = new Bull("paymentQueue", {
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
});

// Define processors for queues

emailQueue.process(async (job) => {
  const { to, subject, body } = job.data;
  // Insert your email sending logic here, e.g. with nodemailer or any service
  console.log(`Sending email to ${to} with subject "${subject}"`);
  // Simulate async email send
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { success: true };
});

paymentQueue.process(async (job) => {
  const { paymentId } = job.data;
  console.log(`Processing payment verification for ${paymentId}`);
  // Implement your payment verification logic here
  // Simulate async processing
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return { verified: true };
});

// Export the queues for usage in controllers or services
module.exports = {
  emailQueue,
  paymentQueue,
};
