// At the top of the controller file
const {
  formatCurrency,
  isValidStockSymbol,
  sanitizeInput,
  formatDateTime,
} = require("../utils/dataHelpers");

// Inside some controller function:
function getStockData(req, res) {
  const symbol = sanitizeInput(req.params.symbol);
  if (!isValidStockSymbol(symbol)) {
    return res.status(400).json({ error: "Invalid stock symbol" });
  }

  // Suppose you get price from DB or API
  const price = 1234.56;
  const formattedPrice = formatCurrency(price);

  const currentTime = formatDateTime(new Date());

  res.json({ symbol, price: formattedPrice, time: currentTime });
}



const axios = require('axios');
const Redis = require('redis');
const { 
  marketDataConfig, 
  getProviderConfig, 
  validateSymbol 
} = require('../config/marketDataconfig');

// Initialize Redis client
let redisClient;
if (marketDataConfig.cache.enabled) {
  redisClient = Redis.createClient({
    host: marketDataConfig.cache.redis.host,
    port: marketDataConfig.cache.redis.port,
    password: marketDataConfig.cache.redis.password,
    db: marketDataConfig.cache.redis.db
  });
}

class StockController {
  // Get stock overview/profile
  static async getStockProfile(req, res) {
    try {
      const { symbol } = req.params;
      
      if (!validateSymbol(symbol)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid symbol format'
        });
      }

      const cacheKey = `stock_profile_${symbol.toUpperCase()}`;
      
      // Check cache first
      if (redisClient) {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return res.json({
            success: true,
            data: JSON.parse(cachedData),
            source: 'cache'
          });
        }
      }

      const profileData = await StockController._fetchStockProfile(symbol);
      
      // Cache the result (longer TTL for company info)
      if (redisClient && profileData) {
        await redisClient.setex(
          cacheKey, 
          marketDataConfig.cache.ttl.historicalData, 
          JSON.stringify(profileData)
        );
      }

      res.json({
        success: true,
        data: profileData,
        source: 'api'
      });

    } catch (error) {
      console.error('Error fetching stock profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock profile',
        error: error.message
      });
    }
  }

  // Get historical stock data
  static async getHistoricalData(req, res) {
    try {
      const { symbol } = req.params;
      const { interval = 'daily', period = '1month' } = req.query;
      
      if (!validateSymbol(symbol)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid symbol format'
        });
      }

      const validIntervals = ['1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly'];
      if (!validIntervals.includes(interval)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid interval. Valid options: ' + validIntervals.join(', ')
        });
      }

      const cacheKey = `historical_${symbol.toUpperCase()}_${interval}_${period}`;
      
      // Check cache
      if (redisClient) {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return res.json({
            success: true,
            data: JSON.parse(cachedData),
            source: 'cache'
          });
        }
      }

      const historicalData = await StockController._fetchHistoricalData(symbol, interval, period);
      
      // Cache the result
      if (redisClient && historicalData) {
        await redisClient.setex(
          cacheKey, 
          marketDataConfig.cache.ttl.historicalData, 
          JSON.stringify(historicalData)
        );
      }

      res.json({
        success: true,
        data: historicalData,
        source: 'api'
      });

    } catch (error) {
      console.error('Error fetching historical data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch historical data',
        error: error.message
      });
    }
  }

  // Get stock fundamentals
  static async getStockFundamentals(req, res) {
    try {
      const { symbol } = req.params;
      
      if (!validateSymbol(symbol)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid symbol format'
        });
      }

      const cacheKey = `fundamentals_${symbol.toUpperCase()}`;
      
      // Check cache
      if (redisClient) {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return res.json({
            success: true,
            data: JSON.parse(cachedData),
            source: 'cache'
          });
        }
      }

      const fundamentals = await StockController._fetchFundamentals(symbol);
      
      // Cache the result
      if (redisClient && fundamentals) {
        await redisClient.setex(
          cacheKey, 
          marketDataConfig.cache.ttl.historicalData, 
          JSON.stringify(fundamentals)
        );
      }

      res.json({
        success: true,
        data: fundamentals,
        source: 'api'
      });

    } catch (error) {
      console.error('Error fetching fundamentals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fundamentals',
        error: error.message
      });
    }
  }

  // Get technical indicators
  static async getTechnicalIndicators(req, res) {
    try {
      const { symbol } = req.params;
      const { indicator = 'SMA', interval = 'daily', timePeriod = '20' } = req.query;
      
      if (!validateSymbol(symbol)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid symbol format'
        });
      }

      const supportedIndicators = ['SMA', 'EMA', 'RSI', 'MACD', 'BBANDS'];
      if (!supportedIndicators.includes(indicator)) {
        return res.status(400).json({
          success: false,
          message: 'Unsupported indicator. Available: ' + supportedIndicators.join(', ')
        });
      }

      const cacheKey = `technical_${symbol.toUpperCase()}_${indicator}_${interval}_${timePeriod}`;
      
      // Check cache
      if (redisClient) {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return res.json({
            success: true,
            data: JSON.parse(cachedData),
            source: 'cache'
          });
        }
      }

      const technicalData = await StockController._fetchTechnicalIndicator(symbol, indicator, interval, timePeriod);
      
      // Cache the result
      if (redisClient && technicalData) {
        await redisClient.setex(
          cacheKey, 
          marketDataConfig.cache.ttl.delayedQuotes, 
          JSON.stringify(technicalData)
        );
      }

      res.json({
        success: true,
        data: technicalData,
        source: 'api'
      });

    } catch (error) {
      console.error('Error fetching technical indicators:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch technical indicators',
        error: error.message
      });
    }
  }

  // Get trending stocks
  static async getTrendingStocks(req, res) {
    try {
      const { category = 'general' } = req.query;
      
      const cacheKey = `trending_stocks_${category}`;
      
      // Check cache
      if (redisClient) {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return res.json({
            success: true,
            data: JSON.parse(cachedData),
            source: 'cache'
          });
        }
      }

      const trendingData = await StockController._getTrendingStocks(category);
      
      // Cache the result
      if (redisClient && trendingData) {
        await redisClient.setex(
          cacheKey, 
          marketDataConfig.cache.ttl.delayedQuotes, 
          JSON.stringify(trendingData)
        );
      }

      res.json({
        success: true,
        data: trendingData,
        source: 'api'
      });

    } catch (error) {
      console.error('Error fetching trending stocks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch trending stocks',
        error: error.message
      });
    }
  }

  // Get stock news
  static async getStockNews(req, res) {
    try {
      const { symbol } = req.params;
      const { limit = 10 } = req.query;
      
      if (!validateSymbol(symbol)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid symbol format'
        });
      }

      const cacheKey = `stock_news_${symbol.toUpperCase()}_${limit}`;
      
      // Check cache
      if (redisClient) {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return res.json({
            success: true,
            data: JSON.parse(cachedData),
            source: 'cache'
          });
        }
      }

      const newsData = await StockController._fetchStockNews(symbol, limit);
      
      // Cache the result
      if (redisClient && newsData) {
        await redisClient.setex(
          cacheKey, 
          marketDataConfig.news.refreshInterval / 1000, 
          JSON.stringify(newsData)
        );
      }

      res.json({
        success: true,
        data: newsData,
        source: 'api'
      });

    } catch (error) {
      console.error('Error fetching stock news:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock news',
        error: error.message
      });
    }
  }

  // Compare multiple stocks
  static async compareStocks(req, res) {
    try {
      const { symbols } = req.body;
      
      if (!Array.isArray(symbols) || symbols.length < 2 || symbols.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'Please provide 2-5 stock symbols for comparison'
        });
      }

      // Validate all symbols
      for (const symbol of symbols) {
        if (!validateSymbol(symbol)) {
          return res.status(400).json({
            success: false,
            message: `Invalid symbol format: ${symbol}`
          });
        }
      }

      const comparisonData = await StockController._compareStocks(symbols);
      
      res.json({
        success: true,
        data: comparisonData
      });

    } catch (error) {
      console.error('Error comparing stocks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to compare stocks',
        error: error.message
      });
    }
  }

  // Get stock recommendations
  static async getStockRecommendations(req, res) {
    try {
      const { symbol } = req.params;
      
      if (!validateSymbol(symbol)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid symbol format'
        });
      }

      const cacheKey = `recommendations_${symbol.toUpperCase()}`;
      
      // Check cache
      if (redisClient) {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return res.json({
            success: true,
            data: JSON.parse(cachedData),
            source: 'cache'
          });
        }
      }

      const recommendations = await StockController._getRecommendations(symbol);
      
      // Cache the result
      if (redisClient && recommendations) {
        await redisClient.setex(
          cacheKey, 
          marketDataConfig.cache.ttl.historicalData, 
          JSON.stringify(recommendations)
        );
      }

      res.json({
        success: true,
        data: recommendations,
        source: 'api'
      });

    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recommendations',
        error: error.message
      });
    }
  }

  // Private helper methods
  static async _fetchStockProfile(symbol) {
    const provider = getProviderConfig('primary');
    
    try {
      const response = await axios.get(provider.baseUrl, {
        params: {
          function: 'OVERVIEW',
          symbol: symbol,
          apikey: provider.apiKey
        },
        timeout: marketDataConfig.errorHandling.timeoutMs
      });

      const data = response.data;
      
      if (data['Error Message'] || Object.keys(data).length === 0) {
        throw new Error('Company overview not available');
      }

      return {
        symbol: data.Symbol,
        name: data.Name,
        description: data.Description,
        exchange: data.Exchange,
        currency: data.Currency,
        country: data.Country,
        sector: data.Sector,
        industry: data.Industry,
        marketCapitalization: parseInt(data.MarketCapitalization),
        peRatio: parseFloat(data.PERatio) || null,
        pegRatio: parseFloat(data.PEGRatio) || null,
        bookValue: parseFloat(data.BookValue) || null,
        dividendPerShare: parseFloat(data.DividendPerShare) || null,
        dividendYield: parseFloat(data.DividendYield) || null,
        eps: parseFloat(data.EPS) || null,
        revenuePerShareTTM: parseFloat(data.RevenuePerShareTTM) || null,
        profitMargin: parseFloat(data.ProfitMargin) || null,
        operatingMarginTTM: parseFloat(data.OperatingMarginTTM) || null,
        returnOnAssetsTTM: parseFloat(data.ReturnOnAssetsTTM) || null,
        returnOnEquityTTM: parseFloat(data.ReturnOnEquityTTM) || null,
        revenueTTM: parseInt(data.RevenueTTM) || null,
        grossProfitTTM: parseInt(data.GrossProfitTTM) || null,
        dilutedEPSTTM: parseFloat(data.DilutedEPSTTM) || null,
        quarterlyEarningsGrowthYOY: parseFloat(data.QuarterlyEarningsGrowthYOY) || null,
        quarterlyRevenueGrowthYOY: parseFloat(data.QuarterlyRevenueGrowthYOY) || null,
        analystTargetPrice: parseFloat(data.AnalystTargetPrice) || null,
        trailingPE: parseFloat(data.TrailingPE) || null,
        forwardPE: parseFloat(data.ForwardPE) || null,
        priceToSalesRatioTTM: parseFloat(data.PriceToSalesRatioTTM) || null,
        priceToBookRatio: parseFloat(data.PriceToBookRatio) || null,
        evToRevenue: parseFloat(data.EVToRevenue) || null,
        evToEBITDA: parseFloat(data.EVToEBITDA) || null,
        beta: parseFloat(data.Beta) || null,
        week52High: parseFloat(data['52WeekHigh']) || null,
        week52Low: parseFloat(data['52WeekLow']) || null,
        movingAverage50Day: parseFloat(data['50DayMovingAverage']) || null,
        movingAverage200Day: parseFloat(data['200DayMovingAverage']) || null,
        sharesOutstanding: parseInt(data.SharesOutstanding) || null,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Failed to fetch profile for ${symbol}: ${error.message}`);
    }
  }

  static async _fetchHistoricalData(symbol, interval, period) {
    const provider = getProviderConfig('primary');
    
    // Map our intervals to Alpha Vantage functions
    const functionMap = {
      '1min': 'TIME_SERIES_INTRADAY',
      '5min': 'TIME_SERIES_INTRADAY',
      '15min': 'TIME_SERIES_INTRADAY',
      '30min': 'TIME_SERIES_INTRADAY',
      '60min': 'TIME_SERIES_INTRADAY',
      'daily': 'TIME_SERIES_DAILY',
      'weekly': 'TIME_SERIES_WEEKLY',
      'monthly': 'TIME_SERIES_MONTHLY'
    };

    try {
      const params = {
        function: functionMap[interval],
        symbol: symbol,
        apikey: provider.apiKey
      };

      // Add interval for intraday data
      if (interval !== 'daily' && interval !== 'weekly' && interval !== 'monthly') {
        params.interval = interval;
      }

      const response = await axios.get(provider.baseUrl, {
        params,
        timeout: marketDataConfig.errorHandling.timeoutMs
      });

      const data = response.data;
      
      // Find the time series key
      const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
      if (!timeSeriesKey) {
        throw new Error('No time series data found');
      }

      const timeSeries = data[timeSeriesKey];
      const historicalData = [];

      // Convert to standard format
      for (const [date, values] of Object.entries(timeSeries)) {
        historicalData.push({
          date: date,
          open: parseFloat(values['1. open']).toFixed(2),
          high: parseFloat(values['2. high']).toFixed(2),
          low: parseFloat(values['3. low']).toFixed(2),
          close: parseFloat(values['4. close']).toFixed(2),
          volume: parseInt(values['5. volume'])
        });
      }

      // Sort by date (newest first) and limit based on period
      historicalData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const limitMap = {
        '1week': 7,
        '1month': 30,
        '3month': 90,
        '6month': 180,
        '1year': 365,
        '2year': 730
      };

      const limit = limitMap[period] || 30;
      
      return {
        symbol: symbol.toUpperCase(),
        interval: interval,
        period: period,
        data: historicalData.slice(0, limit),
        totalPoints: historicalData.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Failed to fetch historical data for ${symbol}: ${error.message}`);
    }
  }

  static async _fetchFundamentals(symbol) {
    // This would typically combine data from multiple endpoints
    // For now, we'll use the overview data and format it for fundamentals
    const profile = await StockController._fetchStockProfile(symbol);
    
    return {
      symbol: profile.symbol,
      fundamentals: {
        valuation: {
          peRatio: profile.peRatio,
          pegRatio: profile.pegRatio,
          priceToBook: profile.priceToBookRatio,
          priceToSales: profile.priceToSalesRatioTTM,
          evToRevenue: profile.evToRevenue,
          evToEBITDA: profile.evToEBITDA
        },
        profitability: {
          profitMargin: profile.profitMargin,
          operatingMargin: profile.operatingMarginTTM,
          returnOnAssets: profile.returnOnAssetsTTM,
          returnOnEquity: profile.returnOnEquityTTM
        },
        growth: {
          earningsGrowthYOY: profile.quarterlyEarningsGrowthYOY,
          revenueGrowthYOY: profile.quarterlyRevenueGrowthYOY
        },
        dividend: {
          dividendPerShare: profile.dividendPerShare,
          dividendYield: profile.dividendYield
        },
        financial: {
          marketCap: profile.marketCapitalization,
          revenue: profile.revenueTTM,
          grossProfit: profile.grossProfitTTM,
          eps: profile.eps,
          bookValue: profile.bookValue
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  static async _fetchTechnicalIndicator(symbol, indicator, interval, timePeriod) {
    const provider = getProviderConfig('primary');
    
    const indicatorMap = {
      'SMA': 'SMA',
      'EMA': 'EMA',
      'RSI': 'RSI',
      'MACD': 'MACD',
      'BBANDS': 'BBANDS'
    };

    try {
      const response = await axios.get(provider.baseUrl, {
        params: {
          function: indicatorMap[indicator],
          symbol: symbol,
          interval: interval,
          time_period: timePeriod,
          series_type: 'close',
          apikey: provider.apiKey
        },
        timeout: marketDataConfig.errorHandling.timeoutMs
      });

      const data = response.data;
      
      // Find the technical analysis key
      const technicalKey = Object.keys(data).find(key => 
        key.includes('Technical Analysis') || key.includes(indicator)
      );
      
      if (!technicalKey) {
        throw new Error('No technical analysis data found');
      }

      const technicalData = data[technicalKey];
      const results = [];

      // Convert to standard format
      for (const [date, values] of Object.entries(technicalData)) {
        const entry = { date };
        
        // Handle different indicator formats
        if (indicator === 'MACD') {
          entry.macd = parseFloat(values.MACD).toFixed(4);
          entry.signal = parseFloat(values.MACD_Signal).toFixed(4);
          entry.histogram = parseFloat(values.MACD_Hist).toFixed(4);
        } else if (indicator === 'BBANDS') {
          entry.upperBand = parseFloat(values['Real Upper Band']).toFixed(2);
          entry.middleBand = parseFloat(values['Real Middle Band']).toFixed(2);
          entry.lowerBand = parseFloat(values['Real Lower Band']).toFixed(2);
        } else if (indicator === 'RSI') {
          entry.rsi = parseFloat(values.RSI).toFixed(2);
        } else {
          entry[indicator.toLowerCase()] = parseFloat(Object.values(values)[0]).toFixed(4);
        }
        
        results.push(entry);
      }

      // Sort by date (newest first)
      results.sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        symbol: symbol.toUpperCase(),
        indicator: indicator,
        interval: interval,
        timePeriod: timePeriod,
        data: results.slice(0, 100), // Limit to last 100 data points
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Failed to fetch ${indicator} for ${symbol}: ${error.message}`);
    }
  }

  static async _getTrendingStocks(category) {
    // Return predefined trending stocks based on category
    const trendingStocks = {
      general: ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA', 'NFLX'],
      tech: ['AAPL', 'GOOGL', 'MSFT', 'META', 'NVDA', 'CRM', 'ADBE', 'ORCL'],
      finance: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'USB', 'PNC'],
      healthcare: ['JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'DHR', 'ABT']
    };

    const symbols = trendingStocks[category] || trendingStocks.general;
    
    // Fetch current quotes for trending stocks
    const quotes = await Promise.allSettled(
      symbols.map(async (symbol) => {
        try {
          // This would call the market data controller's method
          // For now, return mock data structure
          return {
            symbol,
            price: (Math.random() * 200 + 50).toFixed(2),
            change: (Math.random() * 10 - 5).toFixed(2),
            changePercent: (Math.random() * 10 - 5).toFixed(2),
            volume: Math.floor(Math.random() * 10000000)
          };
        } catch (error) {
          return null;
        }
      })
    );

    return {
      category,
      stocks: quotes
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value)
        .sort((a, b) => Math.abs(parseFloat(b.changePercent)) - Math.abs(parseFloat(a.changePercent)))
    };
  }

  static async _fetchStockNews(symbol, limit) {
    const provider = getProviderConfig('primary');
    
    try {
      const response = await axios.get(provider.baseUrl, {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: symbol,
          limit: limit,
          apikey: provider.apiKey
        },
        timeout: marketDataConfig.errorHandling.timeoutMs
      });

      const data = response.data;
      
      if (!data.feed || data.feed.length === 0) {
        return [];
      }

      return data.feed.map(article => ({
        title: article.title,
        url: article.url,
        summary: article.summary,
        source: article.source,
        publishedAt: article.time_published,
        sentiment: {
          label: article.overall_sentiment_label,
          score: parseFloat(article.overall_sentiment_score)
        },
        relevanceScore: parseFloat(article.relevance_score)
      }));

    } catch (error) {
      // Return empty array if news service fails
      console.warn(`News fetch failed for ${symbol}:`, error.message);
      return [];
    }
  }

  static async _compareStocks(symbols) {
    const comparison = {
      symbols: symbols,
      data: {},
      summary: {},
      timestamp: new Date().toISOString()
    };

    // Fetch profiles for all symbols
    for (const symbol of symbols) {
      try {
        const profile = await StockController._fetchStockProfile(symbol);
        comparison.data[symbol] = {
          name: profile.name,
          sector: profile.sector,
          marketCap: profile.marketCapitalization,
          peRatio: profile.peRatio,
          eps: profile.eps,
          dividendYield: profile.dividendYield,
          beta: profile.beta,
          profitMargin: profile.profitMargin,
          week52High: profile.week52High,
          week52Low: profile.week52Low
        };
      } catch (error) {
        comparison.data[symbol] = { error: error.message };
      }
    }

    // Generate comparison summary
    const validData = Object.values(comparison.data).filter(d => !d.error);
    if (validData.length > 1) {
      comparison.summary = {
        highestPE: Math.max(...validData.map(d => d.peRatio || 0)),
        lowestPE: Math.min(...validData.filter(d => d.peRatio).map(d => d.peRatio)),
        highestMarketCap: Math.max(...validData.map(d => d.marketCap || 0)),
        averageDividendYield: (validData.reduce((sum, d) => sum + (d.dividendYield || 0), 0) / validData.length).toFixed(2)
      };
    }

    return comparison;
  }

  static async _getRecommendations(symbol) {
    // This would typically call a recommendations API
    // For now, return a basic analysis based on available data
    try {
      const profile = await StockController._fetchStockProfile(symbol);
      
      const recommendations = {
        symbol: symbol.toUpperCase(),
        overallRating: 'HOLD', // Default rating
        targetPrice: profile.analystTargetPrice,
        recommendations: [],
        analysis: {},
        timestamp: new Date().toISOString()
      };

      // Simple recommendation logic based on fundamentals
      const signals = [];
      
      if (profile.peRatio && profile.peRatio < 15) {
        signals.push({ type: 'BUY', reason: 'Low P/E ratio indicates potential undervaluation' });
      } else if (profile.peRatio && profile.peRatio > 30) {
        signals.push({ type: 'SELL', reason: 'High P/E ratio suggests overvaluation' });
      }

      if (profile.dividendYield && profile.dividendYield > 3) {
        signals.push({ type: 'BUY', reason: 'Attractive dividend yield' });
      }

      if (profile.beta && profile.beta < 1) {
        signals.push({ type: 'HOLD', reason: 'Lower volatility than market' });
      }

      recommendations.recommendations = signals;
      
      // Set overall rating based on signals
      const buySignals = signals.filter(s => s.type === 'BUY').length;
      const sellSignals = signals.filter(s => s.type === 'SELL').length;
      
      if (buySignals > sellSignals) {
        recommendations.overallRating = 'BUY';
      } else if (sellSignals > buySignals) {
        recommendations.overallRating = 'SELL';
      }

      return recommendations;

    } catch (error) {
      throw new Error(`Failed to generate recommendations for ${symbol}: ${error.message}`);
    }
  }
}

module.exports = StockController;