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
const healthRoutes = require('./routes/health');
const compression = require('compression'); // Added for performance
const security = require('./middleware/security');
const { initializeWebSocket, cleanup: cleanupWebSocket } = require('./config/websocket');

const app = express();

// Connect to database
connectDB();

// Create HTTP server and initialize WebSocket
const server = initializeWebSocket(app);

// Trust first proxy (if behind reverse proxy like Nginx)
if (config.env === 'production') {
  app.set('trust proxy', 1);
}

// Apply security middlewares
app.use(security.baseHeaders);  // Helmet with CSP and other security headers
app.use(security.cors);         // CORS configuration
app.use(security.requestSizeLimiter); // Request size limits

// Apply rate limiters to specific routes
app.use('/api/auth', security.rateLimiter.auth);
app.use('/api/payments', security.rateLimiter.sensitive);
app.use('/api', security.rateLimiter.api);

// Compress responses
app.use(compression());

// Logging HTTP requests
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));

// Custom request logging
app.use(loggerMiddleware);

// Additional security measures
app.use(security.xssProtection);
app.use(security.sqlInjection);

// Health check routes (before rate limiting)
app.use('/health', healthRoutes);
app.use('/api/v1/health', healthRoutes);

// Mount API routes
app.use('/api/v1', apiRoutes); // Added versioning

// Handle 404s
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  await cleanupWebSocket();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server };


// backend/server.js or app.js

const express = require("express");
const app = express();
const paymentsRouter = require("./routes/payments");

require("dotenv").config();

app.use(express.json());

// Your other middlewares and routes...

// Mount payments routes
app.use("/api/payments", paymentsRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payments", paymentRoutes);



import express from "express";
import { initializePassport, authenticateJwt } from "./middleware/passport";

const app = express();

app.use(initializePassport());

// Protect routes like this:
app.get("/api/protected-route", authenticateJwt(), (req, res) => {
  res.json({ message: "You accessed a protected route", user: req.user });
});

