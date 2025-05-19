const User = require('../models/User');
const Transaction = require('../models/Transaction');
const FraudAlert = require('../models/FraudAlert');
const Reward = require('../models/Reward');

// Utility for formatting responses
const formatResponse = (success, data, message) => ({
  success,
  data,
  message,
});

// GET /api/analytics/overview
exports.getOverview = async (req, res) => {
  try {
    const [userCount, transactionCount, fraudCount, rewardCount] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      FraudAlert.countDocuments(),
      Reward.countDocuments(),
    ]);

    res.json(formatResponse(true, {
      users: userCount,
      transactions: transactionCount,
      fraudAlerts: fraudCount,
      rewards: rewardCount,
    }, 'Analytics overview fetched successfully'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to fetch analytics overview'));
  }
};

// GET /api/analytics/transactions/summary
exports.getTransactionSummary = async (req, res) => {
  try {
    const totalTransactions = await Transaction.countDocuments();
    const totalAmount = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const avgAmount = await Transaction.aggregate([
      { $group: { _id: null, avg: { $avg: '$amount' } } }
    ]);

    res.json(formatResponse(true, {
      totalTransactions,
      totalAmount: totalAmount[0]?.total || 0,
      averageAmount: avgAmount[0]?.avg || 0,
    }, 'Transaction summary fetched successfully'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to fetch transaction summary'));
  }
};

// GET /api/analytics/fraud/summary
exports.getFraudSummary = async (req, res) => {
  try {
    const fraudAlerts = await FraudAlert.find().sort({ createdAt: -1 }).limit(10);
    const totalFraudAlerts = await FraudAlert.countDocuments();
    const recentFraud = fraudAlerts.map(alert => ({
      transactionId: alert.transactionId,
      userId: alert.userId,
      riskScore: alert.riskScore,
      createdAt: alert.createdAt,
    }));

    res.json(formatResponse(true, {
      totalFraudAlerts,
      recentFraud,
    }, 'Fraud summary fetched successfully'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to fetch fraud summary'));
  }
};

// GET /api/analytics/gamification/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    // Top 10 users by points
    const leaderboard = await User.find({}, { username: 1, points: 1 })
      .sort({ points: -1 })
      .limit(10);

    res.json(formatResponse(true, leaderboard, 'Leaderboard fetched successfully'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to fetch leaderboard'));
  }
};
