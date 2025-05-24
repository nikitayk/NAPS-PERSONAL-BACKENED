const mongoose = require('mongoose');

// Schema for individual stock transactions
const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['buy', 'sell', 'dividend', 'split', 'merge'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  fees: {
    type: Number,
    default: 0,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  broker: {
    type: String,
    trim: true
  },
  orderId: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Schema for dividend records
const dividendSchema = new mongoose.Schema({
  exDate: {
    type: Date,
    required: true
  },
  payDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  frequency: {
    type: String,
    enum: ['quarterly', 'monthly', 'annually', 'semi-annually', 'irregular'],
    default: 'quarterly'
  },
  type: {
    type: String,
    enum: ['cash', 'stock', 'special'],
    default: 'cash'
  },
  reinvested: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Main stock schema
const stockSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  exchange: {
    type: String,
    required: true,
    trim: true
  },
  sector: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  // Current holdings
  totalShares: {
    type: Number,
    default: 0,
    min: 0
  },
  averageCost: {
    type: Number,
    default: 0,
    min: 0
  },
  totalInvested: {
    type: Number,
    default: 0,
    min: 0
  },
  currentPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  lastPriceUpdate: {
    type: Date,
    default: Date.now
  },
  // Portfolio tracking
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    index: true
  },
  portfolioWeight: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  targetWeight: {
    type: Number,
    min: 0,
    max: 100
  },
  // Status and preferences
  status: {
    type: String,
    enum: ['active', 'watchlist', 'sold', 'inactive'],
    default: 'active',
    index: true
  },
  isWatching: {
    type: Boolean,
    default: false,
    index: true
  },
  alertsEnabled: {
    type: Boolean,
    default: false
  },
  priceAlerts: [{
    type: {
      type: String,
      enum: ['above', 'below', 'change_percent'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    triggered: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Transaction history
  transactions: [transactionSchema],
  
  // Dividend tracking
  dividends: [dividendSchema],
  dividendYield: {
    type: Number,
    min: 0,
    max: 100
  },
  annualDividend: {
    type: Number,
    min: 0
  },
  
  // Performance tracking
  dayChange: {
    type: Number,
    default: 0
  },
  dayChangePercent: {
    type: Number,
    default: 0
  },
  totalReturn: {
    type: Number,
    default: 0
  },
  totalReturnPercent: {
    type: Number,
    default: 0
  },
  unrealizedGainLoss: {
    type: Number,
    default: 0
  },
  realizedGainLoss: {
    type: Number,
    default: 0
  },
  
  // Risk metrics
  beta: {
    type: Number
  },
  volatility: {
    type: Number,
    min: 0
  },
  sharpeRatio: {
    type: Number
  },
  
  // Analyst data
  analystRating: {
    rating: {
      type: String,
      enum: ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell']
    },
    targetPrice: {
      type: Number,
      min: 0
    },
    lastUpdated: {
      type: Date
    }
  },
  
  // User notes and tags
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Metadata
  addedDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
stockSchema.index({ userId: 1, symbol: 1 }, { unique: true });
stockSchema.index({ userId: 1, status: 1 });
stockSchema.index({ userId: 1, isWatching: 1 });
stockSchema.index({ portfolioId: 1, status: 1 });
stockSchema.index({ sector: 1, status: 1 });

// Virtual properties
stockSchema.virtual('currentValue').get(function() {
  return this.totalShares * this.currentPrice;
});

stockSchema.virtual('gainLoss').get(function() {
  return this.currentValue - this.totalInvested;
});

stockSchema.virtual('gainLossPercent').get(function() {
  if (this.totalInvested === 0) return 0;
  return ((this.currentValue - this.totalInvested) / this.totalInvested) * 100;
});

stockSchema.virtual('dayValue').get(function() {
  return this.totalShares * this.dayChange;
});

stockSchema.virtual('totalDividendsReceived').get(function() {
  return this.dividends.reduce((sum, div) => sum + div.amount, 0);
});

stockSchema.virtual('isOverweight').get(function() {
  return this.targetWeight && this.portfolioWeight > this.targetWeight;
});

stockSchema.virtual('isUnderweight').get(function() {
  return this.targetWeight && this.portfolioWeight < this.targetWeight;
});

// Pre-save middleware
stockSchema.pre('save', function(next) {
  // Update calculations
  this.calculateHoldings();
  this.calculatePerformance();
  this.lastUpdated = new Date();
  next();
});

// Static methods
stockSchema.statics.findByUser = function(userId, status = 'active') {
  return this.find({ userId, status, isActive: true })
    .sort({ totalInvested: -1 });
};

stockSchema.statics.getWatchlist = function(userId) {
  return this.find({ 
    userId, 
    $or: [{ isWatching: true }, { status: 'watchlist' }],
    isActive: true 
  }).sort({ addedDate: -1 });
};

stockSchema.statics.getPortfolioSummary = async function(userId) {
  const summary = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'active', isActive: true } },
    {
      $group: {
        _id: null,
        totalStocks: { $sum: 1 },
        totalInvested: { $sum: '$totalInvested' },
        totalCurrentValue: { $sum: { $multiply: ['$totalShares', '$currentPrice'] } },
        totalDayChange: { $sum: { $multiply: ['$totalShares', '$dayChange'] } },
        totalDividends: { $sum: '$totalDividendsReceived' },
        sectors: { $addToSet: '$sector' }
      }
    }
  ]);
  
  return summary[0] || {};
};

stockSchema.statics.getTopPerformers = function(userId, limit = 5) {
  return this.find({ userId, status: 'active', isActive: true })
    .sort({ totalReturnPercent: -1 })
    .limit(limit);
};

stockSchema.statics.getWorstPerformers = function(userId, limit = 5) {
  return this.find({ userId, status: 'active', isActive: true })
    .sort({ totalReturnPercent: 1 })
    .limit(limit);
};

stockSchema.statics.getBySector = function(userId, sector) {
  return this.find({ 
    userId, 
    sector: new RegExp(sector, 'i'), 
    status: 'active', 
    isActive: true 
  });
};

stockSchema.statics.searchStocks = function(userId, searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    userId,
    $or: [
      { symbol: regex },
      { name: regex },
      { tags: regex }
    ],
    isActive: true
  });
};

stockSchema.statics.getDiversificationData = async function(userId) {
  const sectorData = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'active', isActive: true } },
    {
      $group: {
        _id: '$sector',
        totalValue: { $sum: { $multiply: ['$totalShares', '$currentPrice'] } },
        stockCount: { $sum: 1 },
        avgReturn: { $avg: '$totalReturnPercent' }
      }
    },
    { $sort: { totalValue: -1 } }
  ]);
  
  return sectorData;
};

// Instance methods
stockSchema.methods.addTransaction = function(transactionData) {
  this.transactions.push(transactionData);
  this.calculateHoldings();
  this.calculatePerformance();
  return this.save();
};

stockSchema.methods.calculateHoldings = function() {
  let totalShares = 0;
  let totalInvested = 0;
  let realizedGainLoss = 0;
  
  this.transactions.forEach(tx => {
    if (tx.type === 'buy') {
      totalShares += tx.quantity;
      totalInvested += tx.totalAmount + tx.fees;
    } else if (tx.type === 'sell') {
      const avgCostAtSale = totalInvested / totalShares;
      const saleValue = tx.totalAmount - tx.fees;
      const costBasis = avgCostAtSale * tx.quantity;
      
      realizedGainLoss += saleValue - costBasis;
      totalShares -= tx.quantity;
      totalInvested -= costBasis;
    } else if (tx.type === 'split') {
      // Handle stock splits
      const splitRatio = tx.quantity; // e.g., 2 for 2:1 split
      totalShares *= splitRatio;
      // Average cost per share decreases
    }
  });
  
  this.totalShares = Math.max(0, totalShares);
  this.totalInvested = Math.max(0, totalInvested);
  this.averageCost = this.totalShares > 0 ? this.totalInvested / this.totalShares : 0;
  this.realizedGainLoss = realizedGainLoss;
};

stockSchema.methods.calculatePerformance = function() {
  if (this.totalShares > 0 && this.currentPrice > 0) {
    const currentValue = this.totalShares * this.currentPrice;
    this.unrealizedGainLoss = currentValue - this.totalInvested;
    this.totalReturn = this.unrealizedGainLoss + this.realizedGainLoss + this.totalDividendsReceived;
    this.totalReturnPercent = this.totalInvested > 0 ? 
      (this.totalReturn / this.totalInvested) * 100 : 0;
  }
};

stockSchema.methods.updatePrice = function(newPrice, dayChange = 0) {
  this.currentPrice = newPrice;
  this.dayChange = dayChange;
  this.dayChangePercent = this.currentPrice > 0 ? 
    (dayChange / this.currentPrice) * 100 : 0;
  this.lastPriceUpdate = new Date();
  
  this.calculatePerformance();
  this.checkPriceAlerts();
  
  return this.save();
};

stockSchema.methods.addDividend = function(dividendData) {
  this.dividends.push(dividendData);
  
  // Update annual dividend estimate
  const thisYearDividends = this.dividends.filter(div => 
    div.payDate.getFullYear() === new Date().getFullYear()
  );
  this.annualDividend = thisYearDividends.reduce((sum, div) => sum + div.amount, 0);
  
  // Calculate dividend yield
  if (this.currentPrice > 0) {
    this.dividendYield = (this.annualDividend / this.currentPrice) * 100;
  }
  
  return this.save();
};

stockSchema.methods.addPriceAlert = function(type, value) {
  this.priceAlerts.push({
    type,
    value,
    triggered: false
  });
  this.alertsEnabled = true;
  return this.save();
};

stockSchema.methods.checkPriceAlerts = function() {
  if (!this.alertsEnabled || this.priceAlerts.length === 0) return false;
  
  let alertTriggered = false;
  
  this.priceAlerts.forEach(alert => {
    if (alert.triggered) return;
    
    let shouldTrigger = false;
    
    switch (alert.type) {
      case 'above':
        shouldTrigger = this.currentPrice >= alert.value;
        break;
      case 'below':
        shouldTrigger = this.currentPrice <= alert.value;
        break;
      case 'change_percent':
        shouldTrigger = Math.abs(this.dayChangePercent) >= alert.value;
        break;
    }
    
    if (shouldTrigger) {
      alert.triggered = true;
      alertTriggered = true;
    }
  });
  
  return alertTriggered;
};

stockSchema.methods.getHoldingPeriod = function() {
  if (this.transactions.length === 0) return 0;
  
  const firstBuy = this.transactions
    .filter(tx => tx.type === 'buy')
    .sort((a, b) => a.date - b.date)[0];
  
  if (!firstBuy) return 0;
  
  const now = new Date();
  const diffTime = Math.abs(now - firstBuy.date);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
};

stockSchema.methods.getAnnualizedReturn = function() {
  const holdingPeriodDays = this.getHoldingPeriod();
  if (holdingPeriodDays === 0 || this.totalInvested === 0) return 0;
  
  const totalReturnRatio = this.totalReturn / this.totalInvested;
  const yearsHeld = holdingPeriodDays / 365.25;
  
  if (yearsHeld === 0) return 0;
  
  return (Math.pow(1 + totalReturnRatio, 1 / yearsHeld) - 1) * 100;
};

const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;