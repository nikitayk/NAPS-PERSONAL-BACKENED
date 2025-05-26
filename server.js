// server.js
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const WebSocketService = require('./src/services/websocketService');
const FraudDetectionService = require('./src/services/fraudDetectionService');
const GamificationService = require('./src/services/gamificationService');
const LearningService = require('./src/services/learningService');

// Import middleware and routes
const passport = require('passport');
const paymentRoutes = require("./src/routes/paymentRoutes");
const { initializePassport, authenticateJwt } = require("./src/middlewares/passport");

// Create Express app
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://naps-personal-1ekp.vercel.app',
  credentials: true
}));

// Initialize passport
app.use(initializePassport());

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'NAPS Backend API is running' });
});

// Mount routes
app.use("/api/payments", paymentRoutes);

// Protected route example
app.get("/api/protected-route", authenticateJwt(), (req, res) => {
  res.json({ message: "You accessed a protected route", user: req.user });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service
const websocketService = new WebSocketService(server);

// Initialize services with WebSocket
FraudDetectionService.initialize(websocketService);
GamificationService.initialize(websocketService);
LearningService.initialize(websocketService);

// Always use the port provided by Railway (or fallback to 5000 locally)
const PORT = process.env.PORT || 5000;

// Start the server (listen on 0.0.0.0 for Railway compatibility)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});


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


