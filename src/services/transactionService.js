const Transaction = require('../models/Transaction');
const User = require('../models/User');
const fraudService = require('./fraudService');

/**
 * Creates a new transaction, analyzes fraud risk, and updates user points.
 * @param {Object} transactionData - Data for the new transaction
 * @param {String} userId - ID of the user making the transaction
 * @returns {Object} The saved transaction
 */
async function createTransaction(transactionData, userId) {
  const { amount, description, category } = transactionData;

  // Basic validation
  if (!amount || !description) {
    throw new Error('Missing required fields');
  }

  // Create transaction instance
  const transaction = new Transaction({
    user: userId,
    amount,
    description,
    category,
    status: 'pending'
  });

  // Analyze fraud risk
  const fraudResult = await fraudService.analyzeTransaction(transaction);
  transaction.fraudScore = fraudResult.riskScore;
  transaction.status = fraudResult.riskScore > 0.7 ? 'review' : 'approved';

  // Save transaction
  await transaction.save();

  // Update user points if approved
  if (transaction.status === 'approved') {
    await User.findByIdAndUpdate(userId, { $inc: { points: 10 } });
  }

  return transaction;
}

/**
 * Retrieves transactions for a user
 * @param {String} userId - ID of the user
 * @param {Object} options - Query options (pagination, filters)
 * @returns {Array} List of transactions
 */
async function getTransactions(userId, options = {}) {
  const { limit = 50, skip = 0 } = options;
  return Transaction.find({ user: userId })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);
}

/**
 * Retrieves a single transaction by ID
 * @param {String} transactionId - ID of the transaction
 * @returns {Object|null} Transaction or null if not found
 */
async function getTransactionById(transactionId) {
  return Transaction.findById(transactionId).populate('user', 'username email');
}

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
};
