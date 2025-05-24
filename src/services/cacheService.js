const NodeCache = require('node-cache');

class CacheService {
  constructor() {
    // Initialize multiple cache instances for different data types
    this.stockPriceCache = new NodeCache({ 
      stdTTL: 60, // 1 minute for real-time stock prices
      checkperiod: 30,
      useClones: false
    });
    
    this.marketDataCache = new NodeCache({ 
      stdTTL: 300, // 5 minutes for market overview data
      checkperiod: 60,
      useClones: false
    });
    
    this.historicalDataCache = new NodeCache({ 
      stdTTL: 3600, // 1 hour for historical data
      checkperiod: 600,
      useClones: false
    });
    
    this.newsCache = new NodeCache({ 
      stdTTL: 900, // 15 minutes for news
      checkperiod: 120,
      useClones: false
    });
    
    this.searchCache = new NodeCache({ 
      stdTTL: 1800, // 30 minutes for search results
      checkperiod: 300,
      useClones: false
    });
    
    this.userDataCache = new NodeCache({ 
      stdTTL: 300, // 5 minutes for user portfolios/watchlists
      checkperiod: 60,
      useClones: false
    });

    // General purpose cache
    this.generalCache = new NodeCache({ 
      stdTTL: 600, // 10 minutes default
      checkperiod: 120,
      useClones: false
    });

    // Setup event listeners for cache statistics
    this.setupEventListeners();
  }

  setupEventListeners() {
    const caches = {
      stockPrice: this.stockPriceCache,
      marketData: this.marketDataCache,
      historical: this.historicalDataCache,
      news: this.newsCache,
      search: this.searchCache,
      userData: this.userDataCache,
      general: this.generalCache
    };

    Object.entries(caches).forEach(([name, cache]) => {
      cache.on('set', (key, value) => {
        console.log(`[${name}Cache] SET: ${key}`);
      });

      cache.on('del', (key, value) => {
        console.log(`[${name}Cache] DEL: ${key}`);
      });

      cache.on('expired', (key, value) => {
        console.log(`[${name}Cache] EXPIRED: ${key}`);
      });
    });
  }

  // Stock Price Cache Methods
  getStockPrice(symbol) {
    return this.stockPriceCache.get(`price_${symbol.toUpperCase()}`);
  }

  setStockPrice(symbol, data, ttl = null) {
    const key = `price_${symbol.toUpperCase()}`;
    if (ttl) {
      this.stockPriceCache.set(key, data, ttl);
    } else {
      this.stockPriceCache.set(key, data);
    }
    return true;
  }

  getMultipleStockPrices(symbols) {
    const keys = symbols.map(symbol => `price_${symbol.toUpperCase()}`);
    return this.stockPriceCache.mget(keys);
  }

  setMultipleStockPrices(stockData, ttl = null) {
    const cacheData = {};
    stockData.forEach(stock => {
      cacheData[`price_${stock.symbol.toUpperCase()}`] = stock;
    });
    
    if (ttl) {
      Object.entries(cacheData).forEach(([key, value]) => {
        this.stockPriceCache.set(key, value, ttl);
      });
    } else {
      this.stockPriceCache.mset(cacheData);
    }
    return true;
  }

  // Market Data Cache Methods
  getMarketOverview() {
    return this.marketDataCache.get('market_overview');
  }

  setMarketOverview(data, ttl = null) {
    if (ttl) {
      this.marketDataCache.set('market_overview', data, ttl);
    } else {
      this.marketDataCache.set('market_overview', data);
    }
    return true;
  }

  getMarketIndices() {
    return this.marketDataCache.get('market_indices');
  }

  setMarketIndices(data, ttl = null) {
    if (ttl) {
      this.marketDataCache.set('market_indices', data, ttl);
    } else {
      this.marketDataCache.set('market_indices', data);
    }
    return true;
  }

  getSectorPerformance() {
    return this.marketDataCache.get('sector_performance');
  }

  setSectorPerformance(data, ttl = null) {
    if (ttl) {
      this.marketDataCache.set('sector_performance', data, ttl);
    } else {
      this.marketDataCache.set('sector_performance', data);
    }
    return true;
  }

  // Historical Data Cache Methods
  getHistoricalData(symbol, period, interval) {
    const key = `historical_${symbol.toUpperCase()}_${period}_${interval}`;
    return this.historicalDataCache.get(key);
  }

  setHistoricalData(symbol, period, interval, data, ttl = null) {
    const key = `historical_${symbol.toUpperCase()}_${period}_${interval}`;
    if (ttl) {
      this.historicalDataCache.set(key, data, ttl);
    } else {
      this.historicalDataCache.set(key, data);
    }
    return true;
  }

  // News Cache Methods
  getNews(symbol = null, limit = 10) {
    const key = symbol ? `news_${symbol.toUpperCase()}_${limit}` : `news_general_${limit}`;
    return this.newsCache.get(key);
  }

  setNews(data, symbol = null, limit = 10, ttl = null) {
    const key = symbol ? `news_${symbol.toUpperCase()}_${limit}` : `news_general_${limit}`;
    if (ttl) {
      this.newsCache.set(key, data, ttl);
    } else {
      this.newsCache.set(key, data);  
    }
    return true;
  }

  // Search Cache Methods
  getSearchResults(query) {
    const key = `search_${query.toLowerCase().replace(/\s+/g, '_')}`;
    return this.searchCache.get(key);
  }

  setSearchResults(query, results, ttl = null) {
    const key = `search_${query.toLowerCase().replace(/\s+/g, '_')}`;
    if (ttl) {
      this.searchCache.set(key, results, ttl);
    } else {
      this.searchCache.set(key, results);
    }
    return true;
  }

  // User Data Cache Methods
  getUserPortfolio(userId) {
    return this.userDataCache.get(`portfolio_${userId}`);
  }

  setUserPortfolio(userId, portfolio, ttl = null) {
    const key = `portfolio_${userId}`;
    if (ttl) {
      this.userDataCache.set(key, portfolio, ttl);
    } else {
      this.userDataCache.set(key, portfolio);
    }
    return true;
  }

  getUserWatchlist(userId) {
    return this.userDataCache.get(`watchlist_${userId}`);
  }

  setUserWatchlist(userId, watchlist, ttl = null) {
    const key = `watchlist_${userId}`;
    if (ttl) {
      this.userDataCache.set(key, watchlist, ttl);
    } else {
      this.userDataCache.set(key, watchlist);
    }
    return true;
  }

  getUserAlerts(userId) {
    return this.userDataCache.get(`alerts_${userId}`);
  }

  setUserAlerts(userId, alerts, ttl = null) {
    const key = `alerts_${userId}`;
    if (ttl) {
      this.userDataCache.set(key, alerts, ttl);
    } else {
      this.userDataCache.set(key, alerts);
    }
    return true;
  }

  // Invalidate user data when portfolio/watchlist changes
  invalidateUserData(userId) {
    this.userDataCache.del(`portfolio_${userId}`);
    this.userDataCache.del(`watchlist_${userId}`);
    this.userDataCache.del(`alerts_${userId}`);
    console.log(`Invalidated user data cache for user: ${userId}`);
  }

  // Forex and Crypto Cache Methods
  getForexRates() {
    return this.marketDataCache.get('forex_rates');
  }

  setForexRates(data, ttl = null) {
    if (ttl) {
      this.marketDataCache.set('forex_rates', data, ttl);
    } else {
      this.marketDataCache.set('forex_rates', data);
    }
    return true;
  }

  getCryptoPrices() {
    return this.marketDataCache.get('crypto_prices');
  }

  setCryptoPrices(data, ttl = null) {
    if (ttl) {
      this.marketDataCache.set('crypto_prices', data, ttl);
    } else {
      this.marketDataCache.set('crypto_prices', data);
    }
    return true;
  }

  // Trending Stocks Cache
  getTrendingStocks() {
    return this.marketDataCache.get('trending_stocks');
  }

  setTrendingStocks(data, ttl = null) {
    if (ttl) {
      this.marketDataCache.set('trending_stocks', data, ttl);
    } else {
      this.marketDataCache.set('trending_stocks', data);
    }
    return true;
  }

  // General Cache Methods
  get(key) {
    return this.generalCache.get(key);
  }

  set(key, value, ttl = null) {
    if (ttl) {
      this.generalCache.set(key, value, ttl);
    } else {
      this.generalCache.set(key, value);
    }
    return true;
  }

  del(key) {
    return this.generalCache.del(key);
  }

  // Cache Statistics and Management
  getStats() {
    return {
      stockPrice: this.stockPriceCache.getStats(),
      marketData: this.marketDataCache.getStats(),
      historical: this.historicalDataCache.getStats(),
      news: this.newsCache.getStats(),
      search: this.searchCache.getStats(),
      userData: this.userDataCache.getStats(),
      general: this.generalCache.getStats()
    };
  }

  getAllKeys() {
    return {
      stockPrice: this.stockPriceCache.keys(),
      marketData: this.marketDataCache.keys(),
      historical: this.historicalDataCache.keys(),
      news: this.newsCache.keys(),
      search: this.searchCache.keys(),
      userData: this.userDataCache.keys(),
      general: this.generalCache.keys()
    };
  }

  // Clear specific cache types
  clearStockPriceCache() {
    this.stockPriceCache.flushAll();
    console.log('Stock price cache cleared');
  }

  clearMarketDataCache() {
    this.marketDataCache.flushAll();
    console.log('Market data cache cleared');
  }

  clearHistoricalDataCache() {
    this.historicalDataCache.flushAll();
    console.log('Historical data cache cleared');
  }

  clearNewsCache() {
    this.newsCache.flushAll();
    console.log('News cache cleared');
  }

  clearSearchCache() {
    this.searchCache.flushAll();
    console.log('Search cache cleared');
  }

  clearUserDataCache() {
    this.userDataCache.flushAll();
    console.log('User data cache cleared');
  }

  clearGeneralCache() {
    this.generalCache.flushAll();
    console.log('General cache cleared');
  }

  // Clear all caches
  clearAllCaches() {
    this.clearStockPriceCache();
    this.clearMarketDataCache();
    this.clearHistoricalDataCache();
    this.clearNewsCache();
    this.clearSearchCache();
    this.clearUserDataCache();
    this.clearGeneralCache();
    console.log('All caches cleared');
  }

  // Warm up cache with commonly requested data
  async warmUpCache() {
    console.log('Starting cache warm-up...');
    
    // This would typically fetch popular stocks, indices, etc.
    const popularSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
    
    // You would implement actual API calls here
    console.log(`Warming up cache for symbols: ${popularSymbols.join(', ')}`);
    
    // Mock warm-up process
    popularSymbols.forEach(symbol => {
      const mockData = {
        symbol,
        price: Math.random() * 1000,
        change: (Math.random() - 0.5) * 20,
        timestamp: new Date().toISOString()
      };
      this.setStockPrice(symbol, mockData);
    });
    
    console.log('Cache warm-up completed');
  }

  // Cache middleware for Express routes
  createCacheMiddleware(cacheType = 'general', ttl = null) {
    return (req, res, next) => {
      const key = `${req.method}_${req.originalUrl}`;
      
      let cachedData;
      switch (cacheType) {
        case 'stockPrice':
          cachedData = this.stockPriceCache.get(key);
          break;
        case 'marketData':
          cachedData = this.marketDataCache.get(key);
          break;
        case 'historical':
          cachedData = this.historicalDataCache.get(key);
          break;
        case 'news':
          cachedData = this.newsCache.get(key);
          break;
        case 'search':
          cachedData = this.searchCache.get(key);
          break;
        case 'userData':
          cachedData = this.userDataCache.get(key);
          break;
        default:
          cachedData = this.generalCache.get(key);
      }

      if (cachedData) {
        console.log(`Cache HIT: ${key}`);
        return res.json(cachedData);
      }

      console.log(`Cache MISS: ${key}`);
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = (data) => {
        // Cache the response
        switch (cacheType) {
          case 'stockPrice':
            if (ttl) {
              this.stockPriceCache.set(key, data, ttl);
            } else {
              this.stockPriceCache.set(key, data);
            }
            break;
          case 'marketData':
            if (ttl) {
              this.marketDataCache.set(key, data, ttl);
            } else {
              this.marketDataCache.set(key, data);
            }
            break;
          case 'historical':
            if (ttl) {
              this.historicalDataCache.set(key, data, ttl);
            } else {
              this.historicalDataCache.set(key, data);
            }
            break;
          case 'news':
            if (ttl) {
              this.newsCache.set(key, data, ttl);
            } else {
              this.newsCache.set(key, data);
            }
            break;
          case 'search':
            if (ttl) {
              this.searchCache.set(key, data, ttl);
            } else {
              this.searchCache.set(key, data);
            }
            break;
          case 'userData':
            if (ttl) {
              this.userDataCache.set(key, data, ttl);
            } else {
              this.userDataCache.set(key, data);
            }
            break;
          default:
            if (ttl) {
              this.generalCache.set(key, data, ttl);
            } else {
              this.generalCache.set(key, data);
            }
        }
        
        // Call original json method
        originalJson.call(res, data);
      };

      next();
    };
  }

  // Health check for cache service
  healthCheck() {
    const stats = this.getStats();
    const totalKeys = Object.values(this.getAllKeys()).reduce((total, keys) => total + keys.length, 0);
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      totalCachedItems: totalKeys,
      cacheStats: stats,
      uptime: process.uptime()
    };
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;