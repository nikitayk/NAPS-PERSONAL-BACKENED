// src/controllers/fraudController.js
const Transaction = require('../models/Transaction');
const FraudAlert = require('../models/FraudAlert');
const fraudService = require('../services/fraudService');

// Utility for consistent responses
const formatResponse = (success, data, message) => ({ success, data, message });

// POST /api/fraud/score - Analyze a transaction for fraud risk
exports.scoreTransaction = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json(formatResponse(false, null, 'Transaction not found'));

    // Call your fraud detection logic (could be ML, rule-based, or external API)
    const { riskScore, explanation } = await fraudService.analyze(transaction);

    // Optionally, store a fraud alert if risk is high
    if (riskScore >= 0.8) {
      const alert = new FraudAlert({
        transactionId: transaction._id,
        userId: transaction.user,
        riskScore,
        explanation,
      });
      await alert.save();
    }

    res.json(formatResponse(true, { riskScore, explanation }, 'Fraud score generated'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to score transaction'));
  }
};

// GET /api/fraud/alerts - List recent fraud alerts
exports.listFraudAlerts = async (req, res) => {
  try {
    const alerts = await FraudAlert.find()
      .populate('userId', 'username')
      .populate('transactionId')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(formatResponse(true, alerts, 'Recent fraud alerts fetched'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to fetch fraud alerts'));
  }
};
