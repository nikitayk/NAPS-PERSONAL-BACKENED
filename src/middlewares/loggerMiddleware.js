const logger = require('../config/logger');

// Express middleware to log each HTTP request
const loggerMiddleware = (req, res, next) => {
  // Log the request details
  logger.info(
    `${req.method} ${req.originalUrl} - IP: ${req.ip} - User: ${req.user ? req.user._id : 'Guest'}`
  );

  // Optionally, log response status after the response is sent
  res.on('finish', () => {
    logger.info(
      `Response: ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - User: ${req.user ? req.user._id : 'Guest'}`
    );
  });

  next();
};

module.exports = loggerMiddleware;
