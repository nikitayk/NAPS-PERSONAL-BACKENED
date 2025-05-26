const express = require('express');
const router = express.Router();

// Core functionality routes
router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/transactions', require('./transactionRoutes'));

// Market and trading routes
router.use('/stocks', require('./stockRoutes'));
router.use('/market-data', require('./marketDataRoutes'));

// Payment and financial routes
router.use('/payments', require('./paymentRoutes'));

// Learning and practice routes
router.use('/lessons', require('./lessonRoutes'));
router.use('/practice', require('./practiceRoutes'));

// Community and social routes
router.use('/forums', require('./forumRoutes'));
router.use('/gamification', require('./gamificationRoutes'));

// Security and analysis routes
router.use('/fraud', require('./fraudRoutes'));
router.use('/analytics', require('./analyticsRoutes'));

// AI assistance routes
router.use('/assistant', require('./assistantRoutes'));

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

module.exports = router;


