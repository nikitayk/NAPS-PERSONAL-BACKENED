const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Overview: total users, transactions, fraud alerts, rewards
router.get('/overview', authenticate, analyticsController.getOverview);

// Transaction summary: totals and averages
router.get('/transactions/summary', authenticate, analyticsController.getTransactionSummary);

// Fraud summary: recent fraud alerts and totals
router.get('/fraud/summary', authenticate, analyticsController.getFraudSummary);

// Gamification leaderboard: top users by points
router.get('/gamification/leaderboard', authenticate, analyticsController.getLeaderboard);

module.exports = router;
