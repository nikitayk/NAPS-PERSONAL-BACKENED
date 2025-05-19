const express = require('express');
const router = express.Router();

// Authentication routes
router.use('/auth', require('./authRoutes'));

// User management routes
router.use('/users', require('./userRoutes'));

// Transaction routes
router.use('/transactions', require('./transactionRoutes'));

// Forum routes
router.use('/forums', require('./forumRoutes'));

// Gamification routes
router.use('/gamification', require('./gamificationRoutes'));

// Fraud detection routes
router.use('/fraud', require('./fraudRoutes'));

// Analytics routes
router.use('/analytics', require('./analyticsRoutes'));

// Lessons routes
router.use('/lessons', require('./lessonRoutes'));

router.use('/assistant', require('./assistantRoutes'));


// Practice routes (for scenarios, quizzes, challenges)
router.use('/practice', require('./practiceRoutes'));

module.exports = router;


