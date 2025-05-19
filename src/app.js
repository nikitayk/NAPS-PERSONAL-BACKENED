const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimiter = require('./middlewares/rateLimiter');
const loggerMiddleware = require('./middlewares/loggerMiddleware');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const config = require('./config/config');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const compression = require('compression'); // Added for performance

const app = express();

// Connect to database
connectDB();

// Trust first proxy (if behind reverse proxy like Nginx)
if (config.env === 'production') {
  app.set('trust proxy', 1);
}

// Security HTTP headers
app.use(helmet());

// Enable CORS with stricter defaults
app.use(cors({
  origin: config.security?.cors?.origin || ['http://localhost:3000'], // Array for multiple origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Compress responses
app.use(compression());

// Logging HTTP requests
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));

// Rate limiting (apply to API routes only)
app.use('/api', rateLimiter);

// Body parsing with stricter limits
app.use(express.json({
  limit: '100kb', // Reduced from 2mb for security
  strict: true
}));
app.use(express.urlencoded({
  extended: true,
  limit: '100kb'
}));

// Custom request logging
app.use(loggerMiddleware);

// Mount API routes
app.use('/api/v1', apiRoutes); // Added versioning

// Handle 404s
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

module.exports = app;

