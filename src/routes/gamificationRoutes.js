const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');
const { authenticate } = require('../middlewares/authMiddleware');

// Get user's rewards and progress
router.get('/rewards', authenticate, gamificationController.getUserProgress);

// Claim a reward
router.post('/rewards/claim', authenticate, gamificationController.claimReward);

// Get leaderboard (top users)
router.get('/leaderboard', gamificationController.getLeaderboard);

module.exports = router;
