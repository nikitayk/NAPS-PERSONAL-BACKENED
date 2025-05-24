const express = require('express');
const router = express.Router();
const axios = require('axios');

// Mock data for development/fallback
const mockStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 2.15, changePercent: 1.24 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2845.32, change: -15.67, changePercent: -0.55 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, change: 5.23, changePercent: 1.40 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 842.15, change: -8.45, changePercent: -0.99 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3456.78, change: 12.34, changePercent: 0.36 }
];

const mockMarketData = {
  indices: [
    { name: 'S&P 500', value: 4512.34, change: 45.67, changePercent: 1.02 },
    { name: 'Dow Jones', value: 35234.56, change: -123.45, changePercent: -0.35 },
    { name: 'NASDAQ', value: 14567.89, change: 234.56, changePercent: 1.64 }
  ],
  sectors: [
    { name: 'Technology', performance: 2.45 },
    { name: 'Healthcare', performance: 1.23 },
    { name: 'Finance', performance: -0.87 },
    { name: 'Energy', performance: 3.21 },
    { name: 'Consumer', performance: 0.98 }
  ]
};

// Get market overview
router.get('/overview', async (req, res) => {
  try {
    // In production, replace with actual API call
    // const response = await axios.get('https://api.marketdata.com/overview');
    
    res.json({
      success: true,
      data: {
        ...mockMarketData,
        timestamp: new Date().toISOString(),
        marketStatus: 'OPEN' // or 'CLOSED' based on market hours
      }
    });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market overview'
    });
  }
});

// Get stock quote by symbol
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // In production, replace with actual API call
    // const response = await axios.get(`https://api.marketdata.com/quote/${symbol}`);
    
    const stock = mockStocks.find(s => s.symbol.toLowerCase() === symbol.toLowerCase());
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock symbol not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...stock,
        timestamp: new Date().toISOString(),
        volume: Math.floor(Math.random() * 10000000),
        high52Week: stock.price * 1.25,
        low52Week: stock.price * 0.75,
        marketCap: Math.floor(Math.random() * 1000000000000),
        pe: (Math.random() * 30 + 10).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock quote'
    });
  }
});

// Get multiple stock quotes
router.post('/quotes', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        message: 'Symbols array is required'
      });
    }

    // In production, replace with actual API call
    const quotes = symbols.map(symbol => {
      const stock = mockStocks.find(s => s.symbol.toLowerCase() === symbol.toLowerCase());
      return stock || { symbol, error: 'Not found' };
    });

    res.json({
      success: true,
      data: quotes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching multiple quotes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock quotes'
    });
  }
});

// Get historical data for a stock
router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1M', interval = '1D' } = req.query;
    
    // Generate mock historical data
    const generateHistoricalData = (days) => {
      const data = [];
      const basePrice = 100;
      let currentPrice = basePrice;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const change = (Math.random() - 0.5) * 10;
        currentPrice += change;
        
        data.push({
          date: date.toISOString().split('T')[0],
          open: +(currentPrice - Math.random() * 2).toFixed(2),
          high: +(currentPrice + Math.random() * 5).toFixed(2),
          low: +(currentPrice - Math.random() * 5).toFixed(2),
          close: +currentPrice.toFixed(2),
          volume: Math.floor(Math.random() * 10000000)
        });
      }
      return data;
    };

    const periodDays = {
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365
    };

    const days = periodDays[period] || 30;
    const historicalData = generateHistoricalData(days);

    res.json({
      success: true,
      data: {
        symbol,
        period,
        interval,
        data: historicalData
      }
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch historical data'
    });
  }
});

// Search for stocks
router.get('/search', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Filter mock stocks based on query
    const results = mockStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    );

    res.json({
      success: true,
      data: results.slice(0, 10) // Limit to 10 results
    });
  } catch (error) {
    console.error('Error searching stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search stocks'
    });
  }
});

// Get trending stocks
router.get('/trending', async (req, res) => {
  try {
    // In production, this would fetch actual trending stocks
    const trending = mockStocks
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map(stock => ({
        ...stock,
        trendScore: Math.floor(Math.random() * 100) + 1
      }));

    res.json({
      success: true,
      data: trending
    });
  } catch (error) {
    console.error('Error fetching trending stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending stocks'
    });
  }
});

// Get market news
router.get('/news', async (req, res) => {
  try {
    const { symbol, limit = 10 } = req.query;
    
    // Mock news data
    const mockNews = [
      {
        id: 1,
        title: 'Market reaches new highs amid positive earnings',
        summary: 'Major indices continue their upward trend as companies report strong quarterly results.',
        source: 'Financial Times',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        url: 'https://example.com/news/1',
        symbol: symbol || null
      },
      {
        id: 2,
        title: 'Tech sector shows resilience in volatile market',
        summary: 'Technology stocks maintain stability despite broader market concerns.',
        source: 'Reuters',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        url: 'https://example.com/news/2',
        symbol: symbol || null
      }
    ];

    res.json({
      success: true,
      data: mockNews.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching market news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market news'
    });
  }
});

// Get currency exchange rates
router.get('/forex', async (req, res) => {
  try {
    const mockForexData = {
      baseCurrency: 'USD',
      rates: {
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.25,
        CAD: 1.25,
        AUD: 1.35,
        CHF: 0.92,
        CNY: 6.45
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockForexData
    });
  } catch (error) {
    console.error('Error fetching forex data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forex data'
    });
  }
});

// Get crypto prices
router.get('/crypto', async (req, res) => {
  try {
    const mockCryptoData = [
      { symbol: 'BTC', name: 'Bitcoin', price: 45234.56, change: 1234.56, changePercent: 2.81 },
      { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change: -123.45, changePercent: -3.45 },
      { symbol: 'ADA', name: 'Cardano', price: 1.23, change: 0.05, changePercent: 4.23 },
      { symbol: 'SOL', name: 'Solana', price: 156.78, change: 12.34, changePercent: 8.56 }
    ];

    res.json({
      success: true,
      data: mockCryptoData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crypto data'
    });
  }
});

module.exports = router;