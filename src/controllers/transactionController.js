// src/controllers/transactionController.js
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const fraudService = require('../services/fraudService');
const { formatResponse } = require('../utils/helpers');

// POST /api/transactions - Create new transaction
exports.createTransaction = async (req, res) => {
  try {
    const { amount, description, category } = req.body;
    
    // Basic validation
    if (!amount || !description) {
      return res.status(400).json(formatResponse(false, null, 'Missing required fields'));
    }

    // Create transaction
    const transaction = new Transaction({
      user: req.user._id,
      amount,
      description,
      category,
      status: 'pending'
    });

    // Fraud analysis
    const fraudResult = await fraudService.analyzeTransaction(transaction);
    transaction.fraudScore = fraudResult.riskScore;
    transaction.status = fraudResult.riskScore > 0.7 ? 'review' : 'approved';

    await transaction.save();

    // Update user points if approved
    if (transaction.status === 'approved') {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { points: 10 } // Award 10 points per transaction
      });
    }

    res.status(201).json(formatResponse(true, transaction, 'Transaction created'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to create transaction'));
  }
};

// GET /api/transactions - List user's transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort('-createdAt')
      .limit(50);

    res.json(formatResponse(true, transactions, 'Transactions fetched'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to fetch transactions'));
  }
};

// GET /api/transactions/:id - Get transaction details
exports.getTransactionDetails = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('user', 'username email');

    if (!transaction) return res.status(404).json(formatResponse(false, null, 'Transaction not found'));

    res.json(formatResponse(true, transaction, 'Transaction details fetched'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to fetch transaction'));
  }
};
