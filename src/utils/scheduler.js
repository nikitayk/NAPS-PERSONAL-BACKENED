const Queue = require("bull");

// Example: Create a Bull queue for background jobs
const jobQueue = new Queue("jobQueue", {
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
  },
});

/**
 * Add a job to the queue
 * @param {string} jobName - Name of the job
 * @param {Object} data - Data to pass to the job processor
 * @param {Object} [opts] - Bull job options like delay, attempts
 * @returns {Promise}
 */
function addJob(jobName, data, opts = {}) {
  return jobQueue.add(jobName, data, opts);
}

/**
 * Process jobs of a specific type
 * @param {string} jobName
 * @param {function} processor - async function(job) that processes the job
 */
function processJob(jobName, processor) {
  jobQueue.process(jobName, processor);
}

/**
 * Gracefully close the queue
 */
async function closeQueue() {
  await jobQueue.close();
}

module.exports = {
  jobQueue,
  addJob,
  processJob,
  closeQueue,
};
