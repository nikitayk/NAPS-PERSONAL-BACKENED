const mongoose = require('mongoose');
const { Schema } = mongoose;

// A FraudAlert represents a flagged transaction or suspicious activity for a user
const fraudAlertSchema = new Schema({
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  riskScore:     { type: Number, required: true }, // e.g., 0.0 (low) to 1.0 (high)
  explanation:   { type: String }, // Human-readable reason for flagging
  alertType:     { type: String, enum: ['initial', 'extended', 'active-duty'], default: 'initial' }, // Optional: for different alert types[2][5]
  status:        { type: String, enum: ['active', 'resolved', 'dismissed'], default: 'active' },
  createdAt:     { type: Date, default: Date.now },
  resolvedAt:    { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);
