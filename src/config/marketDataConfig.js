// Market Data Configuration for NAPS Finance
const marketDataConfig = {
  // API Providers Configuration
  providers: {
    primary: {
      name: 'Alpha Vantage',
      baseUrl: 'https://www.alphavantage.co/query',
      apiKey: process.env.ALPHA_VANTAGE_API_KEY,
      rateLimit: {
        requestsPerMinute: 5,
        requestsPerDay: 500
      }
    },
    secondary: {
      name: 'Finnhub',
      baseUrl: 'https://finnhub.io/api/v1',
      apiKey: process.env.FINNHUB_API_KEY,
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerDay: 1000
      }
    },
    fallback: {
      name: 'Yahoo Finance (Unofficial)',
      baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart',
      apiKey: null, // No API key required
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerDay: 2000
      }
    }
  },

  // Supported Market Data Types
  dataTypes: {
    stocks: {
      enabled: true,
      realTime: false, // Use delayed quotes for free tier
      supportedExchanges: ['NYSE', 'NASDAQ', 'LSE', 'TSX'],
      defaultSymbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']
    },
    forex: {
      enabled: true,
      majorPairs: ['USD/EUR', 'USD/GBP', 'USD/JPY', 'USD/CAD', 'USD/AUD'],
      updateInterval: 300000 // 5 minutes
    },
    crypto: {
      enabled: true,
      supportedCoins: ['BTC', 'ETH', 'ADA', 'DOT', 'LTC'],
      baseCurrency: 'USD'
    },
    indices: {
      enabled: true,
      major: ['^GSPC', '^DJI', '^IXIC', '^RUT'], // S&P 500, Dow, NASDAQ, Russell
      updateInterval: 300000 // 5 minutes
    }
  },

  // Cache Configuration
  cache: {
    enabled: true,
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0
    },
    ttl: {
      realTimeQuotes: 30, // 30 seconds
      delayedQuotes: 900, // 15 minutes
      historicalData: 3600, // 1 hour
      forexRates: 300, // 5 minutes
      cryptoPrices: 60 // 1 minute
    }
  },

  // API Endpoints Configuration
  endpoints: {
    stock: {
      quote: '/stock/quote',
      historical: '/stock/historical',
      search: '/stock/search'
    },
    forex: {
      rates: '/forex/rates',
      historical: '/forex/historical'
    },
    crypto: {
      prices: '/crypto/prices',
      historical: '/crypto/historical'
    },
    indices: {
      current: '/indices/current',
      historical: '/indices/historical'
    },
    portfolio: {
      performance: '/portfolio/performance',
      holdings: '/portfolio/holdings'
    }
  },

  // Data Refresh Settings
  refresh: {
    marketHours: {
      start: '09:30',
      end: '16:00',
      timezone: 'America/New_York'
    },
    intervals: {
      duringMarketHours: 60000, // 1 minute
      afterMarketHours: 300000, // 5 minutes
      weekends: 1800000 // 30 minutes
    },
    batchSize: 10 // Process 10 symbols at once
  },

  // Error Handling
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    timeoutMs: 10000, // 10 seconds
    fallbackEnabled: true,
    logErrors: true
  },

  // Data Format Standards
  dataFormat: {
    precision: {
      price: 2,
      percentage: 2,
      volume: 0
    },
    currency: 'USD',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss'
  },

  // Rate Limiting
  rateLimiting: {
    enabled: true,
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Market Status
  marketStatus: {
    checkInterval: 300000, // 5 minutes
    holidayCalendar: 'US', // US market holidays
    preMarket: {
      enabled: true,
      start: '04:00',
      end: '09:30'
    },
    afterHours: {
      enabled: true,
      start: '16:00',
      end: '20:00'
    }
  },

  // Watchlist Configuration
  watchlist: {
    maxSymbolsPerUser: 50,
    defaultWatchlist: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'],
    categorization: {
      'Tech': ['AAPL', 'GOOGL', 'MSFT', 'META', 'NFLX'],
      'Finance': ['JPM', 'BAC', 'WFC', 'GS', 'MS'],
      'Healthcare': ['JNJ', 'PFE', 'UNH', 'ABBV', 'MRK']
    }
  },

  // News Integration (Optional)
  news: {
    enabled: true,
    sources: ['reuters', 'bloomberg', 'marketwatch'],
    maxArticlesPerSymbol: 5,
    refreshInterval: 900000 // 15 minutes
  },

  // Analytics
  analytics: {
    technicalIndicators: {
      enabled: true,
      supported: ['SMA', 'EMA', 'RSI', 'MACD', 'Bollinger Bands']
    },
    fundamentals: {
      enabled: true,
      metrics: ['P/E', 'EPS', 'Market Cap', 'Dividend Yield']
    }
  }
};

// Helper Functions
const getProviderConfig = (providerName) => {
  return marketDataConfig.providers[providerName] || marketDataConfig.providers.primary;
};

const isMarketOpen = () => {
  const now = new Date();
  const marketStart = new Date();
  const marketEnd = new Date();
  
  const [startHour, startMin] = marketDataConfig.refresh.marketHours.start.split(':');
  const [endHour, endMin] = marketDataConfig.refresh.marketHours.end.split(':');
  
  marketStart.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
  marketEnd.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
  
  const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
  const isDuringHours = now >= marketStart && now <= marketEnd;
  
  return isWeekday && isDuringHours;
};

const getRefreshInterval = () => {
  if (isMarketOpen()) {
    return marketDataConfig.refresh.intervals.duringMarketHours;
  }
  
  const now = new Date();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  
  return isWeekend 
    ? marketDataConfig.refresh.intervals.weekends 
    : marketDataConfig.refresh.intervals.afterMarketHours;
};

const validateSymbol = (symbol) => {
  return /^[A-Z]{1,5}$/.test(symbol.toUpperCase());
};

module.exports = {
  marketDataConfig,
  getProviderConfig,
  isMarketOpen,
  getRefreshInterval,
  validateSymbol
};