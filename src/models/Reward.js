const mongoose = require('mongoose');
const { Schema } = mongoose;

// A Reward represents a gamification incentive a user can earn or claim
const rewardSchema = new Schema({
  name:        { type: String, required: true },
  description: { type: String },
  pointCost:   { type: Number, required: true }, // Points needed to claim this reward
  imageUrl:    { type: String }, // Optional: for displaying in the UI
  isActive:    { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now },
  expiresAt:   { type: Date }, // Optional: expiry for time-limited rewards
}, { timestamps: true });

module.exports = mongoose.model('Reward', rewardSchema);
