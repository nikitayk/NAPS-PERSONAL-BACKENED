const config = require('../config/config');

// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error (using your logger)
  if (config.logger) {
    config.logger.error(err.stack || err.message || err);
  } else {
    // Fallback to console if logger is not set up
    console.error(err.stack || err.message || err);
  }

  // Set status code
  const statusCode = err.statusCode || 500;

  // Avoid leaking sensitive error details in production
  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
