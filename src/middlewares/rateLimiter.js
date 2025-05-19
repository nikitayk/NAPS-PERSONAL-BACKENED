const rateLimit = require('express-rate-limit');

// General rate limiter configuration
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true, // Adds RateLimit-* headers
  legacyHeaders: false,  // Disables X-RateLimit-* headers
  statusCode: 429,
  skipFailedRequests: false, // Count failed requests
  skipSuccessfulRequests: false, // Count successful requests
  keyGenerator: (req) => req.ip, // Identify client by IP
});

module.exports = rateLimiter;
