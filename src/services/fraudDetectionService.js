const config = require('../config/config');
const { OpenAI } = require('openai');
const Redis = require('ioredis');
const Transaction = require('../models/Transaction');
let websocketService;

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

const redis = new Redis(config.redis);

class FraudDetectionService {
  static initialize(ws) {
    websocketService = ws;
  }

  static async analyzeTransaction(transaction) {
    try {
      // Check cache first
      const cacheKey = `fraud_score:${transaction._id}`;
      const cachedScore = await redis.get(cacheKey);
      if (cachedScore) {
        return JSON.parse(cachedScore);
      }

      // Get user's transaction history
      const userHistory = await Transaction.find({
        userId: transaction.userId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).lean();

      // Prepare data for AI analysis
      const transactionData = {
        amount: transaction.amount,
        merchant: transaction.merchant,
        category: transaction.category,
        location: transaction.location,
        time: transaction.createdAt,
        userHistory: userHistory.map(t => ({
          amount: t.amount,
          merchant: t.merchant,
          category: t.category,
          time: t.createdAt
        }))
      };

      // Use OpenAI for advanced pattern recognition
      const aiAnalysis = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "You are a fraud detection AI. Analyze this transaction and provide a risk score and explanation."
        }, {
          role: "user",
          content: JSON.stringify(transactionData)
        }],
        temperature: 0.2,
        max_tokens: 150
      });

      // Rule-based checks
      const ruleBasedScore = await this.performRuleBasedChecks(transaction, userHistory);

      // Combine AI and rule-based analysis
      const finalScore = {
        riskScore: (parseFloat(aiAnalysis.choices[0].message.content.match(/\d+(\.\d+)?/)[0]) + ruleBasedScore) / 2,
        aiExplanation: aiAnalysis.choices[0].message.content,
        ruleBasedFlags: ruleBasedScore > 0.7 ? ['unusual_amount', 'location_mismatch'] : [],
        timestamp: new Date(),
      };

      // Send real-time alert if risk is high
      if (finalScore.riskScore > 0.7 && websocketService) {
        websocketService.sendFraudAlert(transaction.userId, {
          transactionId: transaction._id,
          riskScore: finalScore.riskScore,
          explanation: finalScore.aiExplanation,
          flags: finalScore.ruleBasedFlags
        });
      }

      // Cache the result
      await redis.setex(cacheKey, 3600, JSON.stringify(finalScore));

      return finalScore;
    } catch (error) {
      console.error('Fraud detection error:', error);
      return {
        riskScore: 0.5,
        explanation: 'Error in fraud detection, defaulting to medium risk',
        timestamp: new Date()
      };
    }
  }

  static async performRuleBasedChecks(transaction, history) {
    let riskScore = 0;

    // Check for unusual amount
    const avgAmount = history.reduce((sum, t) => sum + t.amount, 0) / history.length;
    if (transaction.amount > avgAmount * 3) {
      riskScore += 0.3;
    }

    // Check for unusual location
    const userLocations = new Set(history.map(t => t.location));
    if (!userLocations.has(transaction.location)) {
      riskScore += 0.2;
    }

    // Check for frequency
    const last24Hours = history.filter(t => 
      new Date(t.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;
    if (last24Hours > 10) {
      riskScore += 0.2;
    }

    return Math.min(riskScore, 1);
  }

  static async getFraudInsights(userId) {
    const recentTransactions = await Transaction.find({
      userId,
      createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 }).lean();

    const insights = {
      riskLevel: 'LOW',
      recommendations: [],
      suspiciousPatterns: [],
      safetyScore: 100
    };

    // Analyze patterns
    const patterns = this.analyzePatternsForUser(recentTransactions);
    insights.suspiciousPatterns = patterns.suspicious;
    insights.recommendations = patterns.recommendations;
    insights.safetyScore = patterns.safetyScore;

    return insights;
  }

  static analyzePatternsForUser(transactions) {
    // Implementation of pattern analysis
    // This would include checking for:
    // - Unusual spending patterns
    // - Geographic anomalies
    // - Time-based anomalies
    // - Category-based anomalies
    return {
      suspicious: [],
      recommendations: [],
      safetyScore: 85
    };
  }
}

module.exports = FraudDetectionService; 