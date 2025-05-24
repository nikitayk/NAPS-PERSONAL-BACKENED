const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }
    req.user = user;
    next();
  });
};

// Mock database - In production, replace with actual database operations
let userPortfolios = {};
let userWatchlists = {};
let userStockAlerts = {};
let stockTransactions = {};

// Mock stock data
const mockStocks = {
  'AAPL': { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, sector: 'Technology' },
  'GOOGL': { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2845.32, sector: 'Technology' },
  'MSFT': { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, sector: 'Technology' },
  'TSLA': { symbol: 'TSLA', name: 'Tesla Inc.', price: 842.15, sector: 'Automotive' },
  'AMZN': { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3456.78, sector: 'E-commerce' },
  'NVDA': { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 892.45, sector: 'Technology' },
  'META': { symbol: 'META', name: 'Meta Platforms Inc.', price: 334.67, sector: 'Technology' },
  'NFLX': { symbol: 'NFLX', name: 'Netflix Inc.', price: 456.78, sector: 'Entertainment' }
};

// Get user's portfolio
router.get('/portfolio', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const portfolio = userPortfolios[userId] || [];
    
    // Calculate portfolio value and performance
    let totalValue = 0;
    let totalCost = 0;
    
    const portfolioWithCurrentPrices = portfolio.map(holding => {
      const currentStock = mockStocks[holding.symbol];
      if (!currentStock) return holding;
      
      const currentValue = holding.quantity * currentStock.price;
      const totalCostForHolding = holding.quantity * holding.averagePrice;
      const gainLoss = currentValue - totalCostForHolding;
      const gainLossPercent = ((gainLoss / totalCostForHolding) * 100).toFixed(2);
      
      totalValue += currentValue;
      totalCost += totalCostForHolding;
      
      return {
        ...holding,
        currentPrice: currentStock.price,
        currentValue: currentValue.toFixed(2),
        gainLoss: gainLoss.toFixed(2),
        gainLossPercent: parseFloat(gainLossPercent),
        name: currentStock.name
      };
    });
    
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? ((totalGainLoss / totalCost) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        holdings: portfolioWithCurrentPrices,
        summary: {
          totalValue: totalValue.toFixed(2),
          totalCost: totalCost.toFixed(2),
          totalGainLoss: totalGainLoss.toFixed(2),
          totalGainLossPercent: parseFloat(totalGainLossPercent),
          holdingsCount: portfolio.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio'
    });
  }
});

// Add stock to portfolio (buy)
router.post('/portfolio/buy', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, quantity, price } = req.body;
    
    if (!symbol || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: 'Symbol, quantity, and price are required'
      });
    }

    if (!mockStocks[symbol.toUpperCase()]) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    if (!userPortfolios[userId]) {
      userPortfolios[userId] = [];
    }

    // Check if user already owns this stock
    const existingHolding = userPortfolios[userId].find(h => h.symbol === symbol.toUpperCase());
    
    if (existingHolding) {
      // Update existing holding - calculate new average price
      const totalShares = existingHolding.quantity + parseInt(quantity);
      const totalCost = (existingHolding.quantity * existingHolding.averagePrice) + (parseInt(quantity) * parseFloat(price));
      const newAveragePrice = totalCost / totalShares;
      
      existingHolding.quantity = totalShares;
      existingHolding.averagePrice = parseFloat(newAveragePrice.toFixed(2));
      existingHolding.lastUpdated = new Date().toISOString();
    } else {
      // Add new holding
      userPortfolios[userId].push({
        symbol: symbol.toUpperCase(),
        quantity: parseInt(quantity),
        averagePrice: parseFloat(price),
        purchaseDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }

    // Record transaction
    if (!stockTransactions[userId]) {
      stockTransactions[userId] = [];
    }
    
    stockTransactions[userId].push({
      id: Date.now().toString(),
      symbol: symbol.toUpperCase(),
      type: 'BUY',
      quantity: parseInt(quantity),
      price: parseFloat(price),
      total: parseInt(quantity) * parseFloat(price),
      date: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Stock purchased successfully',
      data: {
        symbol: symbol.toUpperCase(),
        quantity: parseInt(quantity),
        price: parseFloat(price)
      }
    });
  } catch (error) {
    console.error('Error buying stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase stock'
    });
  }
});

// Sell stock from portfolio
router.post('/portfolio/sell', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, quantity, price } = req.body;
    
    if (!symbol || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: 'Symbol, quantity, and price are required'
      });
    }

    if (!userPortfolios[userId]) {
      return res.status(404).json({
        success: false,
        message: 'No portfolio found'
      });
    }

    const holdingIndex = userPortfolios[userId].findIndex(h => h.symbol === symbol.toUpperCase());
    
    if (holdingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found in portfolio'
      });
    }

    const holding = userPortfolios[userId][holdingIndex];
    
    if (holding.quantity < parseInt(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient shares to sell'
      });
    }

    // Update or remove holding
    if (holding.quantity === parseInt(quantity)) {
      // Remove holding entirely
      userPortfolios[userId].splice(holdingIndex, 1);
    } else {
      // Reduce quantity
      holding.quantity -= parseInt(quantity);
      holding.lastUpdated = new Date().toISOString();
    }

    // Record transaction
    if (!stockTransactions[userId]) {
      stockTransactions[userId] = [];
    }
    
    stockTransactions[userId].push({
      id: Date.now().toString(),
      symbol: symbol.toUpperCase(),
      type: 'SELL',
      quantity: parseInt(quantity),
      price: parseFloat(price),
      total: parseInt(quantity) * parseFloat(price),
      date: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Stock sold successfully',
      data: {
        symbol: symbol.toUpperCase(),
        quantity: parseInt(quantity),
        price: parseFloat(price)
      }
    });
  } catch (error) {
    console.error('Error selling stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sell stock'
    });
  }
});

// Get user's watchlist
router.get('/watchlist', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const watchlist = userWatchlists[userId] || [];
    
    // Add current prices to watchlist items
    const watchlistWithPrices = watchlist.map(item => {
      const currentStock = mockStocks[item.symbol];
      return {
        ...item,
        currentPrice: currentStock?.price || 0,
        name: currentStock?.name || 'Unknown',
        change: ((Math.random() - 0.5) * 10).toFixed(2), // Mock change
        changePercent: ((Math.random() - 0.5) * 5).toFixed(2) // Mock change percent
      };
    });

    res.json({
      success: true,
      data: watchlistWithPrices
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch watchlist'
    });
  }
});

// Add stock to watchlist
router.post('/watchlist', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required'
      });
    }

    if (!mockStocks[symbol.toUpperCase()]) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    if (!userWatchlists[userId]) {
      userWatchlists[userId] = [];
    }

    // Check if already in watchlist
    const exists = userWatchlists[userId].find(item => item.symbol === symbol.toUpperCase());
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Stock already in watchlist'
      });
    }

    userWatchlists[userId].push({
      symbol: symbol.toUpperCase(),
      addedDate: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Stock added to watchlist',
      data: { symbol: symbol.toUpperCase() }
    });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to watchlist'
    });
  }
});

// Remove stock from watchlist
router.delete('/watchlist/:symbol', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol } = req.params;
    
    if (!userWatchlists[userId]) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found'
      });
    }

    const index = userWatchlists[userId].findIndex(item => item.symbol === symbol.toUpperCase());
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found in watchlist'
      });
    }

    userWatchlists[userId].splice(index, 1);

    res.json({
      success: true,
      message: 'Stock removed from watchlist'
    });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from watchlist'
    });
  }
});

// Get transaction history
router.get('/transactions', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    const transactions = stockTransactions[userId] || [];
    const paginatedTransactions = transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        total: transactions.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

// Set price alert
router.post('/alerts', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, targetPrice, alertType } = req.body; // alertType: 'above' or 'below'
    
    if (!symbol || !targetPrice || !alertType) {
      return res.status(400).json({
        success: false,
        message: 'Symbol, target price, and alert type are required'
      });
    }

    if (!mockStocks[symbol.toUpperCase()]) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    if (!['above', 'below'].includes(alertType)) {
      return res.status(400).json({
        success: false,
        message: 'Alert type must be either "above" or "below"'
      });
    }

    if (!userStockAlerts[userId]) {
      userStockAlerts[userId] = [];
    }

    const alert = {
      id: Date.now().toString(),
      symbol: symbol.toUpperCase(),
      targetPrice: parseFloat(targetPrice),
      alertType,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    userStockAlerts[userId].push(alert);

    res.json({
      success: true,
      message: 'Price alert set successfully',
      data: alert
    });
  } catch (error) {
    console.error('Error setting alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set price alert'
    });
  }
});

// Get user's alerts
router.get('/alerts', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const alerts = userStockAlerts[userId] || [];
    
    // Add current prices to alerts
    const alertsWithPrices = alerts.map(alert => {
      const currentStock = mockStocks[alert.symbol];
      return {
        ...alert,
        currentPrice: currentStock?.price || 0,
        name: currentStock?.name || 'Unknown'
      };
    });

    res.json({
      success: true,
      data: alertsWithPrices
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts'
    });
  }
});

// Delete price alert
router.delete('/alerts/:alertId', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { alertId } = req.params;
    
    if (!userStockAlerts[userId]) {
      return res.status(404).json({
        success: false,
        message: 'No alerts found'
      });
    }

    const index = userStockAlerts[userId].findIndex(alert => alert.id === alertId);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    userStockAlerts[userId].splice(index, 1);

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert'
    });
  }
});

// Get portfolio performance analytics
router.get('/portfolio/analytics', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const portfolio = userPortfolios[userId] || [];
    
    if (portfolio.length === 0) {
      return res.json({
        success: true,
        data: {
          diversification: [],
          performance: {},
          allocation: []
        }
      });
    }

    // Calculate sector diversification
    const sectorAllocation = {};
    let totalValue = 0;
    
    portfolio.forEach(holding => {
      const stock = mockStocks[holding.symbol];
      if (stock) {
        const value = holding.quantity * stock.price;
        totalValue += value;
        
        if (!sectorAllocation[stock.sector]) {
          sectorAllocation[stock.sector] = 0;
        }
        sectorAllocation[stock.sector] += value;
      }
    });

    const diversification = Object.entries(sectorAllocation).map(([sector, value]) => ({
      sector,
      value: value.toFixed(2),
      percentage: ((value / totalValue) * 100).toFixed(2)
    }));

    // Mock performance data
    const performance = {
      dailyReturn: ((Math.random() - 0.5) * 2).toFixed(2),
      weeklyReturn: ((Math.random() - 0.5) * 5).toFixed(2),
      monthlyReturn: ((Math.random() - 0.5) * 10).toFixed(2),
      yearlyReturn: ((Math.random() - 0.5) * 20).toFixed(2)
    };

    res.json({
      success: true,
      data: {
        diversification,
        performance,
        totalValue: totalValue.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio analytics'
    });
  }
});

module.exports = router;