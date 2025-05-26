const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const config = require('../config/config');

// Initialize Redis client for rate limiting
const redis = new Redis(config.redis);

// Rate limiting configuration
const createLimiter = (options = {}) => rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: options.windowMs || config.rateLimit.windowMs,
  max: options.max || config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware configuration
const securityMiddleware = {
  // Basic security headers using helmet
  baseHeaders: helmet({
    contentSecurityPolicy: {
      directives: config.security.csp.directives
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: config.security.hsts,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
  }),

  // Rate limiting middleware
  rateLimiter: {
    // General API rate limit
    api: createLimiter(),
    
    // Stricter limit for authentication endpoints
    auth: createLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5 // 5 requests per windowMs
    }),
    
    // Custom limit for sensitive operations
    sensitive: createLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10 // 10 requests per windowMs
    })
  },

  // CORS configuration middleware
  cors: require('cors')({
    origin: config.security.cors.origin,
    methods: config.security.cors.methods,
    allowedHeaders: config.security.cors.allowedHeaders,
    credentials: config.security.cors.credentials,
    exposedHeaders: config.security.cors.exposedHeaders,
    maxAge: 86400 // 24 hours
  }),

  // SQL injection protection
  sqlInjection: (req, res, next) => {
    const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i;
    const params = { ...req.query, ...req.body };
    
    for (let key in params) {
      if (typeof params[key] === 'string' && sqlPattern.test(params[key])) {
        return res.status(403).json({ 
          error: 'Potential SQL injection detected' 
        });
      }
    }
    next();
  },

  // XSS Protection
  xssProtection: (req, res, next) => {
    const xssPattern = /<script\b[^>]*>(.*?)<\/script>/i;
    const params = { ...req.query, ...req.body };
    
    for (let key in params) {
      if (typeof params[key] === 'string' && xssPattern.test(params[key])) {
        return res.status(403).json({ 
          error: 'Potential XSS attack detected' 
        });
      }
    }
    next();
  },

  // Request size limiter
  requestSizeLimiter: require('express').json({ 
    limit: '10kb' // Limit request size to 10kb
  }),

  // JWT verification error handler
  jwtErrorHandler: (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ 
        error: 'Invalid token or token expired' 
      });
    }
    next(err);
  }
};

module.exports = securityMiddleware; 