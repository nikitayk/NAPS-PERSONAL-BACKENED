// src/services/gamificationService.js
const User = require('../models/User');
const Reward = require('../models/Reward');

/**
 * Add points to a user and handle level-ups.
 */
async function addPoints(userId, points) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.points += points;

  // Example: Level up for every 100 points
  const newLevel = Math.floor(user.points / 100) + 1;
  if (newLevel > user.level) {
    user.level = newLevel;
    // Optionally, add badge or notification
  }

  await user.save();
  return user;
}

/**
 * Claim a reward for a user.
 */
async function claimReward(userId, rewardId) {
  const user = await User.findById(userId);
  const reward = await Reward.findById(rewardId);
  if (!user || !reward) throw new Error('User or reward not found');
  if (user.points < reward.pointCost) throw new Error('Not enough points');

  user.points -= reward.pointCost;
  user.rewards.push(rewardId);
  await user.save();
  return reward;
}

/**
 * Get the top N users for the leaderboard.
 */
async function getLeaderboard(limit = 10) {
  return User.find({}, { username: 1, points: 1, level: 1 })
    .sort({ points: -1 })
    .limit(limit);
}

module.exports = {
  addPoints,
  claimReward,
  getLeaderboard,
};
