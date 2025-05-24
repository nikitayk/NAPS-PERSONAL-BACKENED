const mongoose = require('mongoose');

// Schema for individual watchlist items
const watchlistItemSchema = new mongoose.Schema({
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
    enum: ['stock', 'crypto', 'forex', 'commodity', 'index', 'etf'],
    required: true,
    default: 'stock'
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
  // Price tracking
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
  dayChange: {
    type: Number,
    default: 0
  },
  dayChangePercent: {
    type: Number,
    default: 0
  },
  addedPrice: {
    type: Number,
    required: true,
    min: 0
  },
  priceChangeFromAdded: {
    type: Number,
    default: 0
  },
  priceChangePercentFromAdded: {
    type: Number,
    default: 0
  },
  // Alert settings
  alerts: [{
    type: {
      type: String,
      enum: ['price_above', 'price_below', 'percent_change', 'volume_spike', 'news'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    condition: {
      type: String,
      enum: ['greater_than', 'less_than', 'equals', 'percent_up', 'percent_down'],
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    triggered: {
      type: Boolean,
      default: false
    },
    triggeredAt: {
      type: Date
    },
    triggerCount: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // User preferences
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  notes: {
    type: String,
    trim: true
  },
  targetPrice: {
    type: Number,
    min: 0
  },
  stopLoss: {
    type: Number,
    min: 0
  },
  // Research data
  researchNotes: [{
    note: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['fundamental', 'technical', 'news', 'sentiment', 'general'],
      default: 'general'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Performance tracking
  highestPrice: {
    type: Number,
    min: 0
  },
  lowestPrice: {
    type: Number,
    min: 0
  },
  averagePrice: {
    type: Number,
    min: 0
  },
  volatility: {
    type: Number,
    min: 0
  },
  // Metadata
  addedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastPriceUpdate: {
    type: Date,
    default: Date.now
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewed: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Main watchlist schema
const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'My Watchlist'
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['default', 'growth', 'dividend', 'value', 'momentum', 'sector', 'crypto', 'custom'],
    default: 'default'
  },
  // Watchlist settings
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  allowSharing: {
    type: Boolean,
    default: false
  },
  shareCode: {
    type: String,
    unique: true,
    sparse: true
  },
  // Alert preferences
  alertsEnabled: {
    type: Boolean,
    default: true
  },
  emailAlerts: {
    type: Boolean,
    default: false
  },
  pushAlerts: {
    type: Boolean,
    default: true
  },
  alertFrequency: {
    type: String,
    enum: ['realtime', 'hourly', 'daily', 'weekly'],
    default: 'realtime'
  },
  // Items in this watchlist
  items: [watchlistItemSchema],
  
  // Performance tracking
  totalItems: {
    type: Number,
    default: 0
  },
  gainersCount: {
    type: Number,
    default: 0
  },
  losersCount: {
    type: Number,
    default: 0
  },
  averageChangePercent: {
    type: Number,
    default: 0
  },
  topPerformer: {
    symbol: String,
    changePercent: Number
  },
  worstPerformer: {
    symbol: String,
    changePercent: Number
  },
  // Metadata
  createdAt: {
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

// Indexes
watchlistSchema.index({ userId: 1, isActive: 1 });
watchlistSchema.index({ userId: 1, isDefault: 1 });
watchlistSchema.index({ shareCode: 1 }, { sparse: true });
watchlistSchema.index({ 'items.symbol': 1 });
watchlistSchema.index({ 'items.priority': 1 });

// Virtual properties
watchlistSchema.virtual('itemCount').get(function() {
  return this.items.filter(item => item.isActive).length;
});

watchlistSchema.virtual('activeAlerts').get(function() {
  return this.items.reduce((count, item) => {
    return count + item.alerts.filter(alert => alert.isActive && !alert.triggered).length;
  }, 0);
});

watchlistSchema.virtual('triggeredAlerts').get(function() {
  return this.items.reduce((count, item) => {
    return count + item.alerts.filter(alert => alert.triggered).length;
  }, 0);
});

watchlistSchema.virtual('marketValue').get(function() {
  return this.items.reduce((total, item) => {
    return total + (item.currentPrice || 0);
  }, 0);
});

// Pre-save middleware
watchlistSchema.pre('save', function(next) {
  this.calculatePerformanceMetrics();
  this.lastUpdated = new Date();
  next();
});

// Static methods
watchlistSchema.statics.findByUser = function(userId, includeInactive = false) {
  const query = { userId, isActive: true };
  if (includeInactive) delete query.isActive;
  
  return this.find(query).sort({ isDefault: -1, createdAt: -1 });
};

watchlistSchema.statics.getDefaultWatchlist = function(userId) {
  return this.findOne({ userId, isDefault: true, isActive: true });
};

watchlistSchema.statics.findByShareCode = function(shareCode) {
  return this.findOne({ shareCode, isPublic: true, isActive: true });
};

watchlistSchema.statics.getPublicWatchlists = function(limit = 20) {
  return this.find({ isPublic: true, isActive: true })
    .sort({ itemCount: -1, createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username email');
};

watchlistSchema.statics.searchWatchlists = function(userId, searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    userId,
    $or: [
      { name: regex },
      { description: regex },
      { 'items.symbol': regex },
      { 'items.name': regex }
    ],
    isActive: true
  });
};

watchlistSchema.statics.getWatchlistsByCategory = function(userId, category) {
  return this.find({ userId, category, isActive: true })
    .sort({ createdAt: -1 });
};

watchlistSchema.statics.getAllUserSymbols = async function(userId) {
  const watchlists = await this.find({ userId, isActive: true });
  const symbols = new Set();
  
  watchlists.forEach(watchlist => {
    watchlist.items.forEach(item => {
      if (item.isActive) {
        symbols.add(item.symbol);
      }
    });
  });
  
  return Array.from(symbols);
};

// Instance methods
watchlistSchema.methods.addItem = function(itemData) {
  // Check if item already exists
  const existingItem = this.items.find(item => 
    item.symbol === itemData.symbol.toUpperCase() && item.isActive
  );
  
  if (existingItem) {
    throw new Error('Item already exists in watchlist');
  }
  
  // Add price tracking data
  itemData.addedPrice = itemData.currentPrice;
  itemData.symbol = itemData.symbol.toUpperCase();
  
  this.items.push(itemData);
  this.totalItems = this.items.filter(item => item.isActive).length;
  
  return this.save();
};

watchlistSchema.methods.removeItem = function(symbol) {
  const item = this.items.find(item => 
    item.symbol === symbol.toUpperCase() && item.isActive
  );
  
  if (!item) {
    throw new Error('Item not found in watchlist');
  }
  
  item.isActive = false;
  this.totalItems = this.items.filter(item => item.isActive).length;
  
  return this.save();
};

watchlistSchema.methods.updateItemPrice = function(symbol, priceData) {
  const item = this.items.find(item => 
    item.symbol === symbol.toUpperCase() && item.isActive
  );
  
  if (!item) {
    throw new Error('Item not found in watchlist');
  }
  
  // Update price data
  item.previousClose = item.currentPrice;
  item.currentPrice = priceData.currentPrice;
  item.dayChange = priceData.dayChange || 0;
  item.dayChangePercent = priceData.dayChangePercent || 0;
  
  // Calculate change from when added
  if (item.addedPrice > 0) {
    item.priceChangeFromAdded = item.currentPrice - item.addedPrice;
    item.priceChangePercentFromAdded = 
      ((item.currentPrice - item.addedPrice) / item.addedPrice) * 100;
  }
  
  // Update high/low tracking
  if (!item.highestPrice || item.currentPrice > item.highestPrice) {
    item.highestPrice = item.currentPrice;
  }
  if (!item.lowestPrice || item.currentPrice < item.lowestPrice) {
    item.lowestPrice = item.currentPrice;
  }
  
  item.lastPriceUpdate = new Date();
  
  // Check alerts
  this.checkItemAlerts(item);
  
  return this.save();
};

watchlistSchema.methods.addAlert = function(symbol, alertData) {
  const item = this.items.find(item => 
    item.symbol === symbol.toUpperCase() && item.isActive
  );
  
  if (!item) {
    throw new Error('Item not found in watchlist');
  }
  
  item.alerts.push(alertData);
  return this.save();
};

watchlistSchema.methods.removeAlert = function(symbol, alertId) {
  const item = this.items.find(item => 
    item.symbol === symbol.toUpperCase() && item.isActive
  );
  
  if (!item) {
    throw new Error('Item not found in watchlist');
  }
  
  item.alerts = item.alerts.filter(alert => alert._id.toString() !== alertId);
  return this.save();
};

watchlistSchema.methods.checkItemAlerts = function(item) {
  if (!this.alertsEnabled) return false;
  
  let alertsTriggered = false;
  
  item.alerts.forEach(alert => {
    if (!alert.isActive || alert.triggered) return;
    
    let shouldTrigger = false;
    
    switch (alert.type) {
      case 'price_above':
        shouldTrigger = item.currentPrice >= alert.value;
        break;
      case 'price_below':
        shouldTrigger = item.currentPrice <= alert.value;
        break;
      case 'percent_change':
        if (alert.condition === 'percent_up') {
          shouldTrigger = item.dayChangePercent >= alert.value;
        } else if (alert.condition === 'percent_down') {
          shouldTrigger = item.dayChangePercent <= -alert.value;
        }
        break;
      case 'volume_spike':
        // This would need volume data from market data
        break;
    }
    
    if (shouldTrigger) {
      alert.triggered = true;
      alert.triggeredAt = new Date();
      alert.triggerCount += 1;
      alertsTriggered = true;
    }
  });
  
  return alertsTriggered;
};

watchlistSchema.methods.addResearchNote = function(symbol, noteData) {
  const item = this.items.find(item => 
    item.symbol === symbol.toUpperCase() && item.isActive
  );
  
  if (!item) {
    throw new Error('Item not found in watchlist');
  }
  
  item.researchNotes.push(noteData);
  return this.save();
};

watchlistSchema.methods.updateItemView = function(symbol) {
  const item = this.items.find(item => 
    item.symbol === symbol.toUpperCase() && item.isActive
  );
  
  if (!item) {
    throw new Error('Item not found in watchlist');
  }
  
  item.viewCount += 1;
  item.lastViewed = new Date();
  
  return this.save();
};

watchlistSchema.methods.calculatePerformanceMetrics = function() {
  const activeItems = this.items.filter(item => item.isActive);
  
  this.totalItems = activeItems.length;
  this.gainersCount = activeItems.filter(item => item.dayChangePercent > 0).length;
  this.losersCount = activeItems.filter(item => item.dayChangePercent < 0).length;
  
  if (activeItems.length > 0) {
    this.averageChangePercent = activeItems.reduce((sum, item) => 
      sum + item.dayChangePercent, 0) / activeItems.length;
    
    // Find top and worst performers
    const sortedByPerformance = activeItems.sort((a, b) => 
      b.dayChangePercent - a.dayChangePercent
    );
    
    if (sortedByPerformance.length > 0) {
      this.topPerformer = {
        symbol: sortedByPerformance[0].symbol,
        changePercent: sortedByPerformance[0].dayChangePercent
      };
      
      this.worstPerformer = {
        symbol: sortedByPerformance[sortedByPerformance.length - 1].symbol,
        changePercent: sortedByPerformance[sortedByPerformance.length - 1].dayChangePercent
      };
    }
  }
};

watchlistSchema.methods.generateShareCode = function() {
  if (!this.allowSharing) {
    throw new Error('Sharing is not enabled for this watchlist');
  }
  
  this.shareCode = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
  this.isPublic = true;
  
  return this.save();
};

watchlistSchema.methods.getPerformanceSummary = function() {
  const activeItems = this.items.filter(item => item.isActive);
  
  return {
    totalItems: activeItems.length,
    gainers: this.gainersCount,
    losers: this.losersCount,
    unchanged: activeItems.length - this.gainersCount - this.losersCount,
    averageChange: this.averageChangePercent,
    topPerformer: this.topPerformer,
    worstPerformer: this.worstPerformer,
    totalAlerts: this.activeAlerts,
    triggeredAlerts: this.triggeredAlerts
  };
};

watchlistSchema.methods.exportToCSV = function() {
  const activeItems = this.items.filter(item => item.isActive);
  
  const headers = ['Symbol', 'Name', 'Type', 'Current Price', 'Day Change', 'Day Change %', 'Added Price', 'Change from Added', 'Change % from Added', 'Priority', 'Tags'];
  
  const rows = activeItems.map(item => [
    item.symbol,
    item.name,
    item.type,
    item.currentPrice,
    item.dayChange,
    item.dayChangePercent,
    item.addedPrice,
    item.priceChangeFromAdded,
    item.priceChangePercentFromAdded,
    item.priority,
    item.tags.join(', ')
  ]);
  
  return [headers, ...rows];
};

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

module.exports = Watchlist;