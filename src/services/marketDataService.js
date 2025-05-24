const axios = require('axios');
const cacheService = require('./cacheService');

class MarketDataService {
  constructor() {
    // API Configuration
    this.apiConfig = {
      alphaVantage: {
        baseUrl: 'https://www.alphavantage.co/query',
        apiKey: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
        timeout: 10000
      },
      finnhub: {
        baseUrl: 'https://finnhub.io/api/v1',
        apiKey: process.env.FINNHUB_API_KEY || 'demo',
        timeout: 10000
      },
      polygon: {
        baseUrl: 'https://api.polygon.io/v1',
        apiKey: process.env.POLYGON_API_KEY || 'demo',
        timeout: 10000
      },
      newsapi: {
        baseUrl: 'https://newsapi.org/v2',
        apiKey: process.env.NEWS_API_KEY || 'demo',
        timeout: 10000
      }
    };

    // Rate limiting configuration
    this.rateLimits = {
      alphaVantage: { calls: 0, resetTime: Date.now() + 60000, maxCalls: 5 },
      finnhub: { calls: 0, resetTime: Date.now() + 60000, maxCalls: 60 },
      polygon: { calls: 0, resetTime: Date.now() + 60000, maxCalls: 5 },
      newsapi: { calls: 0, resetTime: Date.now() + 3600000, maxCalls: 100 }
    };

    // Axios instances for different APIs
    this.alphaVantageClient = axios.create({
      baseURL: this.apiConfig.alphaVantage.baseUrl,
      timeout: this.apiConfig.alphaVantage.timeout,
      headers: { 'User-Agent': 'NAPS-Finance/1.0' }
    });

    this.finnhubClient = axios.create({
      baseURL: this.apiConfig.finnhub.baseUrl,
      timeout: this.apiConfig.finnhub.timeout,
      headers: { 'X-Finnhub-Token': this.apiConfig.finnhub.apiKey }
    });

    this.polygonClient = axios.create({
      baseURL: this.apiConfig.polygon.baseUrl,
      timeout: this.apiConfig.polygon.timeout
    });

    this.newsClient = axios.create({
      baseURL: this.apiConfig.newsapi.baseUrl,
      timeout: this.apiConfig.newsapi.timeout
    });

    // Mock data for development/fallback
    this.mockData = this.initializeMockData();
  }

  initializeMockData() {
    return {
      stocks: {
        'AAPL': { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 2.15, changePercent: 1.24, volume: 89234567, marketCap: 2789000000000 },
        'GOOGL': { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2845.32, change: -15.67, changePercent: -0.55, volume: 1234567, marketCap: 1890000000000 },
        'MSFT': { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, change: 5.23, changePercent: 1.40, volume: 45678901, marketCap: 2345000000000 },
        'TSLA': { symbol: 'TSLA', name: 'Tesla Inc.', price: 842.15, change: -8.45, changePercent: -0.99, volume: 67890123, marketCap: 845000000000 },
        'AMZN': { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3456.78, change: 12.34, changePercent: 0.36, volume: 23456789, marketCap: 1678000000000 },
        'NVDA': { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 892.45, change: 15.67, changePercent: 1.79, volume: 34567890, marketCap: 2100000000000 },
        'META': { symbol: 'META', name: 'Meta Platforms Inc.', price: 334.67, change: -7.89, changePercent: -2.31, volume: 56789012, marketCap: 890000000000 },
        'NFLX': { symbol: 'NFLX', name: 'Netflix Inc.', price: 456.78, change: 8.90, changePercent: 1.99, volume: 12345678, marketCap: 201000000000 }
      },
      indices: [
        { symbol: 'SPY', name: 'S&P 500', value: 4512.34, change: 45.67, changePercent: 1.02 },
        { symbol: 'DIA', name: 'Dow Jones', value: 35234.56, change: -123.45, changePercent: -0.35 },
        { symbol: 'QQQ', name: 'NASDAQ', value: 14567.89, change: 234.56, changePercent: 1.64 },
        { symbol: 'IWM', name: 'Russell 2000', value: 2134.56, change: 12.34, changePercent: 0.58 }
      ],
      sectors: [
        { name: 'Technology', symbol: 'XLK', performance: 2.45, volume: 123456789 },
        { name: 'Healthcare', symbol: 'XLV', performance: 1.23, volume: 87654321 },
        { name: 'Financials', symbol: 'XLF', performance: -0.87, volume: 98765432 },
        { name: 'Energy', symbol: 'XLE', performance: 3.21, volume: 76543210 },
        { name: 'Consumer Discretionary', symbol: 'XLY', performance: 0.98, volume: 65432109 },
        { name: 'Communication Services', symbol: 'XLC', performance: 1.45, volume: 54321098 },
        { name: 'Industrials', symbol: 'XLI', performance: 0.76, volume: 43210987 },
        { name: 'Materials', symbol: 'XLB', performance: -0.34, volume: 32109876 }
      ],
      forex: {
        'USD/EUR': { rate: 0.85, change: -0.012, changePercent: -1.39 },
        'USD/GBP': { rate: 0.73, change: 0.008, changePercent: 1.11 },
        'USD/JPY': { rate: 110.25, change: 0.45, changePercent: 0.41 },
        'USD/CAD': { rate: 1.25, change: -0.015, changePercent: -1.19 },
        'USD/AUD': { rate: 1.35, change: 0.023, changePercent: 1.73 },
        'USD/CHF': { rate: 0.92, change: -0.007, changePercent: -0.75 }
      },
      crypto: [
        { symbol: 'BTC', name: 'Bitcoin', price: 45234.56, change: 1234.56, changePercent: 2.81, volume: 1234567890 },
        { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change: -123.45, changePercent: -3.45, volume: 987654321 },
        { symbol: 'ADA', name: 'Cardano', price: 1.23, change: 0.05, changePercent: 4.23, volume: 765432109 },
        { symbol: 'SOL', name: 'Solana', price: 156.78, change: 12.34, changePercent: 8.56, volume: 543210987 },
        { symbol: 'DOT', name: 'Polkadot', price: 34.56, change: -2.34, changePercent: -6.34, volume: 432109876 }
      ]
    };
  }

  // Rate limiting helper
  checkRateLimit(service) {
    const limit = this.rateLimits[service];
    const now = Date.now();
    
    if (now > limit.resetTime) {
      limit.calls = 0;
      limit.resetTime = now + (service === 'newsapi' ? 3600000 : 60000);
    }
    
    if (limit.calls >= limit.maxCalls) {
      throw new Error(`Rate limit exceeded for ${service}. Try again later.`);
    }
    
    limit.calls++;
    return true;
  }

  // Get stock quote with caching
  async getStockQuote(symbol) {
    try {
      // Check cache first
      const cached = cacheService.getStockPrice(symbol);
      if (cached) {
        console.log(`Cache hit for stock quote: ${symbol}`);
        return cached;
      }

      // Try to fetch from API
      let stockData;
      
      try {
        // Try Alpha Vantage first
        this.checkRateLimit('alphaVantage');
        stockData = await this.fetchFromAlphaVantage(symbol);
      } catch (error) {
        console.log(`Alpha Vantage failed for ${symbol}, trying Finnhub:`, error.message);
        
        try {
          // Fallback to Finnhub
          this.checkRateLimit('finnhub');
          stockData = await this.fetchFromFinnhub(symbol);
        } catch (fallbackError) {
          console.log(`Finnhub failed for ${symbol}, using mock data:`, fallbackError.message);
          // Use mock data as final fallback
          stockData = this.mockData.stocks[symbol.toUpperCase()] || this.generateMockStock(symbol);
        }
      }

      // Cache the result
      cacheService.setStockPrice(symbol, stockData);
      return stockData;
      
    } catch (error) {
      console.error(`Error getting stock quote for ${symbol}:`, error);
      
      // Return mock data as ultimate fallback
      return this.mockData.stocks[symbol.toUpperCase()] || this.generateMockStock(symbol);
    }
  }

  // Fetch multiple stock quotes
  async getMultipleStockQuotes(symbols) {
    try {
      // Check cache for all symbols
      const cachedData = cacheService.getMultipleStockPrices(symbols);
      const uncachedSymbols = symbols.filter(symbol => !cachedData[`price_${symbol.toUpperCase()}`]);
      
      if (uncachedSymbols.length === 0) {
        console.log(`Cache hit for all symbols: ${symbols.join(', ')}`);
        return Object.values(cachedData);
      }

      // Fetch uncached symbols
      const promises = uncachedSymbols.map(symbol => this.getStockQuote(symbol));
      const freshData = await Promise.allSettled(promises);
      
      // Combine cached and fresh data
      const allData = [];
      symbols.forEach(symbol => {
        const cached = cachedData[`price_${symbol.toUpperCase()}`];
        if (cached) {
          allData.push(cached);
        } else {
          const freshIndex = uncachedSymbols.indexOf(symbol);
          if (freshIndex !== -1 && freshData[freshIndex].status === 'fulfilled') {
            allData.push(freshData[freshIndex].value);
          }
        }
      });

      return allData;
    } catch (error) {
      console.error('Error getting multiple stock quotes:', error);
      return symbols.map(symbol => this.mockData.stocks[symbol.toUpperCase()] || this.generateMockStock(symbol));
    }
  }

  // Get market overview
  async getMarketOverview() {
    try {
      // Check cache first
      const cached = cacheService.getMarketOverview();
      if (cached) {
        console.log('Cache hit for market overview');
        return cached;
      }

      // Fetch fresh data
      const [indices, sectors] = await Promise.allSettled([
        this.getMarketIndices(),
        this.getSectorPerformance()
      ]);

      const marketData = {
        indices: indices.status === 'fulfilled' ? indices.value : this.mockData.indices,
        sectors: sectors.status === 'fulfilled' ? sectors.value : this.mockData.sectors,
        timestamp: new Date().toISOString(),
        marketStatus: this.getMarketStatus()
      };

      // Cache the result
      cacheService.setMarketOverview(marketData);
      return marketData;
      
    } catch (error) {
      console.error('Error getting market overview:', error);
      return {
        indices: this.mockData.indices,
        sectors: this.mockData.sectors,
        timestamp: new Date().toISOString(),
        marketStatus: this.getMarketStatus()
      };
    }
  }

  // Get market indices
  async getMarketIndices() {
    try {
      const cached = cacheService.getMarketIndices();
      if (cached) {
        return cached;
      }

      // In production, fetch from actual API
      const indices = this.mockData.indices.map(index => ({
        ...index,
        timestamp: new Date().toISOString()
      }));

      cacheService.setMarketIndices(indices);
      return indices;
    } catch (error) {
      console.error('Error getting market indices:', error);
      return this.mockData.indices;
    }
  }

  // Get sector performance
  async getSectorPerformance() {
    try {
      const cached = cacheService.getSectorPerformance();
      if (cached) {
        return cached;
      }

      // In production, fetch from actual API
      const sectors = this.mockData.sectors.map(sector => ({
        ...sector,
        timestamp: new Date().toISOString()
      }));

      cacheService.setSectorPerformance(sectors);
      return sectors;
    } catch (error) {
      console.error('Error getting sector performance:', error);
      return this.mockData.sectors;
    }
  }

  // Get historical data
  async getHistoricalData(symbol, period = '1M', interval = '1D') {
    try {
      // Check cache first
      const cached = cacheService.getHistoricalData(symbol, period, interval);
      if (cached) {
        console.log(`Cache hit for historical data: ${symbol} ${period} ${interval}`);
        return cached;
      }

      // Generate mock historical data for now
      const historicalData = this.generateHistoricalData(symbol, period, interval);
      
      // Cache the result
      cacheService.setHistoricalData(symbol, period, interval, historicalData);
      return historicalData;
      
    } catch (error) {
      console.error(`Error getting historical data for ${symbol}:`, error);
      return this.generateHistoricalData(symbol, period, interval);
    }
  }

  // Search stocks
  async searchStocks(query) {
    try {
      // Check cache first
      const cached = cacheService.getSearchResults(query);
      if (cached) {
        console.log(`Cache hit for search: ${query}`);
        return cached;
      }

      // Filter mock stocks based on query
      const results = Object.values(this.mockData.stocks).filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);

      // Cache the results
      cacheService.setSearchResults(query, results);
      return results;
      
    } catch (error) {
      console.error(`Error searching stocks for query: ${query}`, error);
      return [];
    }
  }

  // Get trending stocks
  async getTrendingStocks() {
    try {
      const cached = cacheService.getTrendingStocks();
      if (cached) {
        return cached;
      }

      // Mock trending calculation
      const trending = Object.values(this.mockData.stocks)
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(stock => ({
          ...stock,
          trendScore: Math.floor(Math.random() * 100) + 1,
          volume24h: stock.volume * (1 + Math.random())
        }));

      cacheService.setTrendingStocks(trending);
      return trending;
    } catch (error) {
      console.error('Error getting trending stocks:', error);
      return Object.values(this.mockData.stocks).slice(0, 5);
    }
  }

  // Get forex rates
  async getForexRates() {
    try {
      const cached = cacheService.getForexRates();
      if (cached) {
        return cached;
      }

      const forexData = {
        baseCurrency: 'USD',
        rates: this.mockData.forex,
        timestamp: new Date().toISOString()
      };

      cacheService.setForexRates(forexData);
      return forexData;
    } catch (error) {
      console.error('Error getting forex rates:', error);
      return {
        baseCurrency: 'USD',
        rates: this.mockData.forex,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get crypto prices
  async getCryptoPrices() {
    try {
      const cached = cacheService.getCryptoPrices();
      if (cached) {
        return cached;
      }

      const cryptoData = this.mockData.crypto.map(crypto => ({
        ...crypto,
        timestamp: new Date().toISOString()
      }));

      cacheService.setCryptoPrices(cryptoData);
      return cryptoData;
    } catch (error) {
      console.error('Error getting crypto prices:', error);
      return this.mockData.crypto;
    }
  }

  // Get market news
  async getMarketNews(symbol = null, limit = 10) {
    try {
      const cached = cacheService.getNews(symbol, limit);
      if (cached) {
        return cached;
      }

      // Mock news data
      const mockNews = this.generateMockNews(symbol, limit);
      
      cacheService.setNews(mockNews, symbol, limit);
      return mockNews;
    } catch (error) {
      console.error('Error getting market news:', error);
      return this.generateMockNews(symbol, limit);
    }
  }

  // Helper methods
  async fetchFromAlphaVantage(symbol) {
    const response = await this.alphaVantageClient.get('', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: this.apiConfig.alphaVantage.apiKey
      }
    });

    if (response.data['Error Message']) {
      throw new Error(response.data['Error Message']);
    }

    const quote = response.data['Global Quote'];
    return {
      symbol: quote['01. symbol'],
      name: symbol, // Alpha Vantage doesn't provide company name in quote
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      timestamp: new Date().toISOString()
    };
  }

  async fetchFromFinnhub(symbol) {
    const response = await this.finnhubClient.get(`/quote?symbol=${symbol}`);
    
    return {
      symbol: symbol,
      name: symbol,
      price: response.data.c,
      change: response.data.d,
      changePercent: response.data.dp,
      volume: response.data.v || 0,
      timestamp: new Date().toISOString()
    };
  }

  generateMockStock(symbol) {
    const basePrice = Math.random() * 500 + 50;
    return {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Corp.`,
      price: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(((Math.random() - 0.5) * 20).toFixed(2)),
      changePercent: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)),
      volume: Math.floor(Math.random() * 10000000),
      marketCap: Math.floor(Math.random() * 1000000000000),
      timestamp: new Date().toISOString()
    };
  }

  generateHistoricalData(symbol, period, interval) {
    const periodDays = {
      '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '2Y': 730, '5Y': 1825
    };
    
    const days = periodDays[period] || 30;
    const data = [];
    const basePrice = this.mockData.stocks[symbol.toUpperCase()]?.price || 100;
    let currentPrice = basePrice;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const volatility = Math.random() * 0.05; // 5% volatility
      const change = (Math.random() - 0.5) * volatility * currentPrice;
      currentPrice = Math.max(currentPrice + change, 1); // Ensure price doesn't go negative
      
      data.push({
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        open: +(currentPrice - Math.random() * 2).toFixed(2),
        high: +(currentPrice + Math.random() * 5).toFixed(2),
        low: +(currentPrice - Math.random() * 5).toFixed(2),
        close: +currentPrice.toFixed(2),
        volume: Math.floor(Math.random() * 10000000)
      });
    }
    
    return {
      symbol,
      period,
      interval,
      data
    };
  }

  generateMockNews(symbol, limit) {
    const headlines = [
      'Market reaches new highs amid positive earnings reports',
      'Tech sector shows resilience in volatile market conditions',
      'Federal Reserve announces new monetary policy decisions',
      'Quarterly earnings exceed analyst expectations',
      'Breaking: Major acquisition announced in technology sector',
      'Market volatility continues as investors weigh economic data',
      'Oil prices surge following geopolitical developments',
      'Healthcare stocks rally on FDA approval news',
      'Consumer spending data shows strong economic growth',
      'Cryptocurrency market experiences significant movements'
    ];

    const sources = ['Reuters', 'Bloomberg', 'Financial Times', 'Wall Street Journal', 'MarketWatch', 'CNBC'];
    
    return Array.from({ length: limit }, (_, i) => ({
      id: i + 1,
      title: headlines[i % headlines.length] + (symbol ? ` - ${symbol}` : ''),
      summary: `Detailed analysis of market movements and their impact on ${symbol || 'the broader market'}. Key insights from industry experts and market analysts.`,
      source: sources[i % sources.length],
      publishedAt: new Date(Date.now() - (i * 3600000)).toISOString(),
      url: `https://example.com/news/${i + 1}`,
      symbol: symbol || null,
      sentiment: Math.random() > 0.5 ? 'positive' : 'negative'
    }));
  }

  getMarketStatus() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getHours();
    
    // Simple market hours check (9:30 AM - 4:00 PM Eastern, Monday-Friday)
    if (day === 0 || day === 6) {
      return 'CLOSED'; // Weekend
    }
    
    if (hour >= 9 && hour < 16) {
      return 'OPEN';
    } else {
      return 'CLOSED';
    }
  }

  // Service health check
  async healthCheck() {
    try {
      const testSymbol = 'AAPL';
      await this.getStockQuote(testSymbol);
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          alphaVantage: this.rateLimits.alphaVantage.calls < this.rateLimits.alphaVantage.maxCalls,
          finnhub: this.rateLimits.finnhub.calls < this.rateLimits.finnhub.maxCalls,
          cache: cacheService.healthCheck().status === 'healthy'
        },
        rateLimits: this.rateLimits
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
const marketDataService = new MarketDataService();

module.exports = marketDataService;