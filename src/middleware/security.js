const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const config = require('../config/config');
const cors = require('cors');
const express = require('express');

// Initialize Redis client for rate limiting
const redis = new Redis(config.redis);

// Rate limiting configuration
const createLimiter = (options = {}) => rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:',
  }),
  windowMs: options.windowMs || config.rateLimit.windowMs,
  max: options.max || config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const corsOptions = {
  origin: [
    'https://naps-personal-1ekp.vercel.app',
    'http://localhost:3000'  // Keep local development working
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Security middleware configuration
const securityMiddleware = {
  // Basic security headers using helmet
  baseHeaders: (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  },

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
  cors: cors(corsOptions),

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
  requestSizeLimiter: express.json({ limit: '10mb' }),

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