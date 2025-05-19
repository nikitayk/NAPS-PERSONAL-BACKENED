const mongoose = require('mongoose');
const { Schema } = mongoose;

// A Transaction represents a user's financial transaction
const transactionSchema = new Schema({
  user:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount:      { type: Number, required: true },
  description: { type: String, required: true },
  category:    { type: String }, // e.g., 'food', 'rent', 'shopping'
  status:      { type: String, enum: ['pending', 'approved', 'review', 'rejected'], default: 'pending' },
  fraudScore:  { type: Number, min: 0, max: 1, default: 0 }, // 0 (safe) to 1 (high risk)
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
