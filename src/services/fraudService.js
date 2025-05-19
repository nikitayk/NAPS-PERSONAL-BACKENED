// src/services/fraudService.js
const config = require('../config/config');
// Uncomment if using FraudLabs Pro
// const { FraudValidation } = require('fraudlabspro-nodejs');

/**
 * Analyze a transaction for fraud risk.
 * You can use custom rules, ML, or third-party APIs.
 * @param {Object} transaction - The transaction object.
 * @returns {Object} { riskScore: Number (0-1), explanation: String }
 */
async function analyzeTransaction(transaction) {
  // Example: Simple rule-based scoring
  let riskScore = 0;
  let explanation = 'Transaction appears normal.';

  if (transaction.amount > 1000) {
    riskScore += 0.5;
    explanation = 'High amount flagged for review.';
  }
  if (transaction.category === 'electronics') {
    riskScore += 0.2;
    explanation += ' Electronics purchases are higher risk.';
  }

  // Example: Integrate with FraudLabs Pro (uncomment and configure as needed)
  /*
  const flp = new FraudValidation(config.fraudDetection.apiKey);
  const params = {
    ip: transaction.ip,
    billing: {
      email: transaction.userEmail,
      // ...other fields
    },
    order: {
      amount: transaction.amount,
      currency: 'USD',
      order_id: transaction._id.toString(),
    }
  };
  const result = await new Promise((resolve, reject) => {
    flp.validate(params, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
  riskScore = result.fraudlabspro_score / 100; // Normalize to 0-1
  explanation = result.fraudlabspro_status;
  */

  // Clamp riskScore to [0,1]
  riskScore = Math.min(1, Math.max(0, riskScore));
  return { riskScore, explanation };
}

module.exports = {
  analyzeTransaction,
};
