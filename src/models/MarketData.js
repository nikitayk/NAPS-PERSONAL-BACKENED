const mongoose = require('mongoose');

// Schema for individual market data points
const marketDataSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['stock', 'crypto', 'forex', 'commodity', 'index'],
    required: true,
    index: true
  },
  exchange: {
    type: String,
    required: true,
    trim: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    uppercase: true
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  previousClose: {
    type: Number,
    required: true,
    min: 0
  },
  change: {
    type: Number,
    required: true
  },
  changePercent: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    default: 0,
    min: 0
  },
  marketCap: {
    type: Number,
    min: 0
  },
  dayHigh: {
    type: Number,
    min: 0
  },
  dayLow: {
    type: Number,
    min: 0
  },
  fiftyTwoWeekHigh: {
    type: Number,
    min: 0
  },
  fiftyTwoWeekLow: {
    type: Number,
    min: 0
  },
  peRatio: {
    type: Number,
    min: 0
  },
  dividendYield: {
    type: Number,
    min: 0,
    max: 100
  },
  beta: {
    type: Number
  },
  eps: {
    type: Number
  },
  avgVolume: {
    type: Number,
    min: 0
  },
  sector: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  logoUrl: {
    type: String,
    trim: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    enum: ['manual', 'api', 'feed'],
    default: 'api'
  },
  // Historical data points (last 30 days for quick access)
  historicalData: [{
    date: {
      type: Date,
      required: true
    },
    open: {
      type: Number,
      required: true,
      min: 0
    },
    high: {
      type: Number,
      required: true,
      min: 0
    },
    low: {
      type: Number,
      required: true,
      min: 0
    },
    close: {
      type: Number,
      required: true,
      min: 0
    },
    volume: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  // Technical indicators
  technicalIndicators: {
    rsi: {
      type: Number,
      min: 0,
      max: 100
    },
    movingAverage50: {
      type: Number,
      min: 0
    },
    movingAverage200: {
      type: Number,
      min: 0
    },
    macd: {
      type: Number
    },
    bollinger: {
      upper: {
        type: Number,
        min: 0
      },
      middle: {
        type: Number,
        min: 0
      },
      lower: {
        type: Number,
        min: 0
      }
    }
  },
  // Fundamental data for stocks
  fundamentals: {
    revenue: {
      type: Number,
      min: 0
    },
    netIncome: {
      type: Number
    },
    totalAssets: {
      type: Number,
      min: 0
    },
    totalDebt: {
      type: Number,
      min: 0
    },
    bookValue: {
      type: Number
    },
    roe: {
      type: Number
    },
    roa: {
      type: Number
    },
    debtToEquity: {
      type: Number,
      min: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for efficient querying
marketDataSchema.index({ symbol: 1, type: 1 }, { unique: true });
marketDataSchema.index({ type: 1, lastUpdated: -1 });
marketDataSchema.index({ sector: 1, type: 1 });
marketDataSchema.index({ isActive: 1, lastUpdated: -1 });

// Virtual for market status
marketDataSchema.virtual('marketStatus').get(function() {
  const now = new Date();
  const lastUpdate = new Date(this.lastUpdated);
  const diffMinutes = (now - lastUpdate) / (1000 * 60);
  
  if (diffMinutes < 5) return 'live';
  if (diffMinutes < 60) return 'delayed';
  return 'stale';
});

// Virtual for trend analysis
marketDataSchema.virtual('trend').get(function() {
  if (this.changePercent > 2) return 'strong_up';
  if (this.changePercent > 0) return 'up';
  if (this.changePercent < -2) return 'strong_down';
  if (this.changePercent < 0) return 'down';
  return 'neutral';
});

// Virtual for volatility indicator
marketDataSchema.virtual('volatility').get(function() {
  if (this.dayHigh && this.dayLow && this.currentPrice) {
    const dailyRange = ((this.dayHigh - this.dayLow) / this.currentPrice) * 100;
    if (dailyRange > 5) return 'high';
    if (dailyRange > 2) return 'medium';
    return 'low';
  }
  return 'unknown';
});

// Pre-save middleware to calculate derived fields
marketDataSchema.pre('save', function(next) {
  if (this.currentPrice && this.previousClose) {
    this.change = this.currentPrice - this.previousClose;
    this.changePercent = ((this.change / this.previousClose) * 100);
  }
  
  // Update lastUpdated timestamp
  this.lastUpdated = new Date();
  
  next();
});

// Static methods
marketDataSchema.statics.findBySymbol = function(symbol) {
  return this.findOne({ symbol: symbol.toUpperCase(), isActive: true });
};

marketDataSchema.statics.findByType = function(type, limit = 50) {
  return this.find({ type, isActive: true })
    .sort({ lastUpdated: -1 })
    .limit(limit);
};

marketDataSchema.statics.getTopMovers = function(type = null, limit = 10) {
  const query = { isActive: true };
  if (type) query.type = type;
  
  return this.find(query)
    .sort({ changePercent: -1 })
    .limit(limit);
};

marketDataSchema.statics.getTopLosers = function(type = null, limit = 10) {
  const query = { isActive: true };
  if (type) query.type = type;
  
  return this.find(query)
    .sort({ changePercent: 1 })
    .limit(limit);
};

marketDataSchema.statics.getMostActive = function(type = null, limit = 10) {
  const query = { isActive: true, volume: { $gt: 0 } };
  if (type) query.type = type;
  
  return this.find(query)
    .sort({ volume: -1 })
    .limit(limit);
};

marketDataSchema.statics.searchSymbols = function(searchTerm, limit = 20) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { symbol: regex },
      { name: regex }
    ],
    isActive: true
  }).limit(limit);
};

marketDataSchema.statics.getBySector = function(sector, limit = 50) {
  return this.find({ 
    sector: new RegExp(sector, 'i'), 
    isActive: true,
    type: 'stock'
  }).limit(limit);
};

marketDataSchema.statics.getMarketOverview = async function() {
  const overview = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgChange: { $avg: '$changePercent' },
        totalVolume: { $sum: '$volume' },
        gainers: {
          $sum: {
            $cond: [{ $gt: ['$changePercent', 0] }, 1, 0]
          }
        },
        losers: {
          $sum: {
            $cond: [{ $lt: ['$changePercent', 0] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  return overview;
};

// Instance methods
marketDataSchema.methods.addHistoricalData = function(dataPoint) {
  this.historicalData.push(dataPoint);
  
  // Keep only last 30 days
  if (this.historicalData.length > 30) {
    this.historicalData = this.historicalData.slice(-30);
  }
  
  return this.save();
};

marketDataSchema.methods.updatePrice = function(newPrice, volume = null) {
  this.previousClose = this.currentPrice;
  this.currentPrice = newPrice;
  this.change = newPrice - this.previousClose;
  this.changePercent = ((this.change / this.previousClose) * 100);
  
  if (volume !== null) {
    this.volume = volume;
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

marketDataSchema.methods.calculateSMA = function(period = 20) {
  if (this.historicalData.length < period) {
    return null;
  }
  
  const recentData = this.historicalData.slice(-period);
  const sum = recentData.reduce((acc, data) => acc + data.close, 0);
  return sum / period;
};

marketDataSchema.methods.isStale = function(maxMinutes = 15) {
  const now = new Date();
  const diffMinutes = (now - this.lastUpdated) / (1000 * 60);
  return diffMinutes > maxMinutes;
};

marketDataSchema.methods.getPerformanceMetrics = function() {
  const current = this.currentPrice;
  const metrics = {};
  
  if (this.fiftyTwoWeekHigh) {
    metrics.fromYearHigh = ((current - this.fiftyTwoWeekHigh) / this.fiftyTwoWeekHigh) * 100;
  }
  
  if (this.fiftyTwoWeekLow) {
    metrics.fromYearLow = ((current - this.fiftyTwoWeekLow) / this.fiftyTwoWeekLow) * 100;
  }
  
  if (this.historicalData.length > 0) {
    const weekAgo = this.historicalData.slice(-7)[0];
    if (weekAgo) {
      metrics.weekChange = ((current - weekAgo.close) / weekAgo.close) * 100;
    }
    
    const monthAgo = this.historicalData.slice(-30)[0];
    if (monthAgo) {
      metrics.monthChange = ((current - monthAgo.close) / monthAgo.close) * 100;
    }
  }
  
  return metrics;
};

const MarketData = mongoose.model('MarketData', marketDataSchema);

module.exports = MarketData;