const { emailQueue, paymentQueue } = require("./queues/JobQueues");

// Start processing jobs (this runs continuously)
emailQueue.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
});

paymentQueue.on("completed", (job) => {
  console.log(`Payment job ${job.id} completed`);
});
