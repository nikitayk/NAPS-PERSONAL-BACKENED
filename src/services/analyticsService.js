const User = require('../models/User');
const Transaction = require('../models/Transaction');
const FraudAlert = require('../models/FraudAlert');
const Reward = require('../models/Reward');

/**
 * Returns an overview of key metrics.
 */
async function getOverview() {
  const [userCount, transactionCount, fraudCount, rewardCount] = await Promise.all([
    User.countDocuments(),
    Transaction.countDocuments(),
    FraudAlert.countDocuments(),
    Reward.countDocuments(),
  ]);
  return {
    users: userCount,
    transactions: transactionCount,
    fraudAlerts: fraudCount,
    rewards: rewardCount,
  };
}

/**
 * Returns transaction summary stats.
 */
async function getTransactionSummary() {
  const totalTransactions = await Transaction.countDocuments();
  const [{ total = 0 } = {}] = await Transaction.aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const [{ avg = 0 } = {}] = await Transaction.aggregate([
    { $group: { _id: null, avg: { $avg: '$amount' } } }
  ]);
  return {
    totalTransactions,
    totalAmount: total,
    averageAmount: avg,
  };
}

/**
 * Returns recent fraud alerts and total count.
 */
async function getFraudSummary(limit = 10) {
  const totalFraudAlerts = await FraudAlert.countDocuments();
  const recentFraud = await FraudAlert.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username')
    .populate('transactionId');
  return {
    totalFraudAlerts,
    recentFraud,
  };
}

/**
 * Returns the top N users by points for the leaderboard.
 */
async function getLeaderboard(limit = 10) {
  const leaderboard = await User.find({}, { username: 1, points: 1, level: 1 })
    .sort({ points: -1 })
    .limit(limit);
  return leaderboard;
}

module.exports = {
  getOverview,
  getTransactionSummary,
  getFraudSummary,
  getLeaderboard,
};
