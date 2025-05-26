// src/config/config.js

// Only load .env locally, not in production (Railway injects env vars)
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const { createLogger, format, transports } = require('winston');

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production') {
  const requiredEnvs = [
    'DATABASE_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'EMAIL_API_KEY',
    'FRAUD_API_KEY'
  ];
  requiredEnvs.forEach(env => {
    if (!process.env[env]) throw new Error(`Missing required environment variable: ${env}`);
  });
}

const config = {
  // Core Application Configuration
  env: process.env.NODE_ENV || 'development',
  // Always use process.env.PORT (Railway sets this), fallback to 5000 locally
  port: process.env.PORT || 5000,
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',

  // Database Configuration (MongoDB)
  database: {
    uri: process.env.DATABASE_URI || 'mongodb://localhost:27017/naps',
    options: {
      autoIndex: process.env.NODE_ENV === 'development',
    },
  },

  // Authentication & Security
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'development_refresh_secret',
    expiration: process.env.JWT_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    issuer: process.env.JWT_ISSUER || 'NAPS API',
    audience: process.env.JWT_AUDIENCE || 'naps-app',
  },

  // Fraud Detection Parameters
  fraudDetection: {
    apiKey: process.env.FRAUD_API_KEY || 'dev-key',
    threshold: {
      highRisk: 0.8,
      mediumRisk: 0.5,
    },
    mlModelEndpoint: process.env.ML_MODEL_ENDPOINT || 'http://localhost:8000/predict',
  },

  // Gamification Settings
  gamification: {
    points: {
      transactionReview: 10,
      dailyLogin: 5,
      forumContribution: 20,
    },
    levels: [100, 300, 600, 1000],
  },

  // Email Service Configuration
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    service: process.env.EMAIL_SERVICE || 'SendGrid',
    apiKey: process.env.EMAIL_API_KEY || 'dev-key',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@naps.com',
    smtp: {
      host: process.env.EMAIL_SMTP_HOST || 'smtp.sendgrid.net',
      port: process.env.EMAIL_SMTP_PORT ? parseInt(process.env.EMAIL_SMTP_PORT, 10) : 587,
      user: process.env.EMAIL_SMTP_USER || 'apikey',
      pass: process.env.EMAIL_SMTP_PASS || '',
    },
    templates: {
      verification: process.env.EMAIL_TEMPLATE_VERIFICATION || 'd-1234567890',
      fraudAlert: process.env.EMAIL_TEMPLATE_FRAUD_ALERT || 'd-0987654321',
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) : 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    redisUrl: process.env.REDIS_URL,
  },

  // Logging Configuration
  logger: createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.splat(),
      format.json()
    ),
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          process.env.NODE_ENV === 'production' ? format.json() : format.simple()
        ),
      }),
      new transports.File({
        filename: 'logs/error.log',
        level: 'error',
        handleExceptions: true,
      }),
      new transports.File({
        filename: 'logs/combined.log',
        handleRejections: true,
      }),
    ],
    exitOnError: false,
  }),

  // Security Configuration
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
        : ['http://localhost:3000', 'https://naps-personal.vercel.app'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      exposedHeaders: ['set-cookie'],
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    csp: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://naps-personal.vercel.app"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://naps-personal.vercel.app"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "https://naps-personal.vercel.app", "ws://localhost:3000", "wss://naps-personal.vercel.app"],
      },
    },
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD,
  },

  // New fields from the code block
  mongoUri: process.env.DATABASE_URI,
  corsOrigin: process.env.CORS_ORIGIN || 'https://naps-personal-1ekp.vercel.app',
  openaiApiKey: process.env.OPENAI_API_KEY,
};

// Add proxy trust in production
if (config.env === 'production') {
  config.proxy = {
    trust: process.env.PROXY_TRUST || 'loopback',
  };
}

module.exports = config;


