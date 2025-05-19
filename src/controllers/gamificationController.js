// src/controllers/gamificationController.js
const User = require('../models/User');
const Reward = require('../models/Reward');
const { formatResponse } = require('../utils/helpers');

// GET /api/gamification/rewards - Get user's rewards and progress
exports.getUserProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('points level badges')
      .populate('rewards', 'name description');

    if (!user) return res.status(404).json(formatResponse(false, null, 'User not found'));

    res.json(formatResponse(true, user, 'Progress fetched successfully'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to fetch progress'));
  }
};

// POST /api/gamification/rewards/claim - Claim a reward
exports.claimReward = async (req, res) => {
  try {
    const { rewardId } = req.body;
    const reward = await Reward.findById(rewardId);
    const user = await User.findById(req.user._id);

    if (!reward || user.points < reward.pointCost) {
      return res.status(400).json(formatResponse(false, null, 'Not enough points or invalid reward'));
    }

    user.points -= reward.pointCost;
    user.rewards.push(rewardId);
    await user.save();

    res.json(formatResponse(true, user, 'Reward claimed successfully'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to claim reward'));
  }
};

// GET /api/gamification/leaderboard - Get top 25 users
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.aggregate([
      { $sort: { points: -1 } },
      { $limit: 25 },
      { $project: { 
        username: 1, 
        points: 1, 
        level: 1,
        rewardsCount: { $size: "$rewards" }
      }}
    ]);

    res.json(formatResponse(true, leaderboard, 'Leaderboard fetched'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to fetch leaderboard'));
  }
};
