const axios = require('axios');
const Redis = require('redis');
const { 
  marketDataConfig, 
  getProviderConfig, 
  isMarketOpen, 
  getRefreshInterval, 
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

class MarketDataController {
  // Get stock quote
  static async getStockQuote(req, res) {
    try {
      const { symbol } = req.params;
      
      if (!validateSymbol(symbol)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid symbol format'
        });
      }

      const cacheKey = `stock_quote_${symbol.toUpperCase()}`;
      
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

      // Fetch from API
      const quoteData = await MarketDataController._fetchStockQuote(symbol);
      
      // Cache the result
      if (redisClient && quoteData) {
        await redisClient.setex(
          cacheKey, 
          marketDataConfig.cache.ttl.delayedQuotes, 
          JSON.stringify(quoteData)
        );
      }

      res.json({
        success: true,
        data: quoteData,
        source: 'api'
      });

    } catch (error) {
      console.error('Error fetching stock quote:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock quote',
        error: error.message
      });
    }
  }

  // Get multiple stock quotes
  static async getMultipleQuotes(req, res) {
    try {
      const { symbols } = req.body;
      
      if (!Array.isArray(symbols) || symbols.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Symbols array is required'
        });
      }

      if (symbols.length > marketDataConfig.refresh.batchSize) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${marketDataConfig.refresh.batchSize} symbols allowed per request`
        });
      }

      const quotes = await Promise.allSettled(
        symbols.map(symbol => MarketDataController._fetchStockQuote(symbol))
      );

      const results = quotes.map((quote, index) => ({
        symbol: symbols[index],
        success: quote.status === 'fulfilled',
        data: quote.status === 'fulfilled' ? quote.value : null,
        error: quote.status === 'rejected' ? quote.reason.message : null
      }));

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Error fetching multiple quotes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quotes',
        error: error.message
      });
    }
  }

  // Get forex rates
  static async getForexRates(req, res) {
    try {
      const { pairs } = req.query;
      const requestedPairs = pairs ? pairs.split(',') : marketDataConfig.dataTypes.forex.majorPairs;

      const cacheKey = `forex_rates_${requestedPairs.join('_')}`;
      
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

      const forexData = await MarketDataController._fetchForexRates(requestedPairs);
      
      // Cache the result
      if (redisClient && forexData) {
        await redisClient.setex(
          cacheKey, 
          marketDataConfig.cache.ttl.forexRates, 
          JSON.stringify(forexData)
        );
      }

      res.json({
        success: true,
        data: forexData,
        source: 'api'
      });

    } catch (error) {
      console.error('Error fetching forex rates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch forex rates',
        error: error.message
      });
    }
  }

  // Get crypto prices
  static async getCryptoPrices(req, res) {
    try {
      const { coins } = req.query;
      const requestedCoins = coins ? coins.split(',') : marketDataConfig.dataTypes.crypto.supportedCoins;

      const cacheKey = `crypto_prices_${requestedCoins.join('_')}`;
      
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

      const cryptoData = await MarketDataController._fetchCryptoPrices(requestedCoins);
      
      // Cache the result
      if (redisClient && cryptoData) {
        await redisClient.setex(
          cacheKey, 
          marketDataConfig.cache.ttl.cryptoPrices, 
          JSON.stringify(cryptoData)
        );
      }

      res.json({
        success: true,
        data: cryptoData,
        source: 'api'
      });

    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch crypto prices',
        error: error.message
      });
    }
  }

  // Get market indices
  static async getMarketIndices(req, res) {
    try {
      const cacheKey = 'market_indices';
      
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

      const indicesData = await MarketDataController._fetchMarketIndices();
      
      // Cache the result
      if (redisClient && indicesData) {
        await redisClient.setex(
          cacheKey, 
          marketDataConfig.cache.ttl.delayedQuotes, 
          JSON.stringify(indicesData)
        );
      }

      res.json({
        success: true,
        data: indicesData,
        source: 'api'
      });

    } catch (error) {
      console.error('Error fetching market indices:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch market indices',
        error: error.message
      });
    }
  }

  // Search stocks
  static async searchStocks(req, res) {
    try {
      const { query } = req.query;
      
      if (!query || query.length < 1) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const searchResults = await MarketDataController._searchStocks(query);
      
      res.json({
        success: true,
        data: searchResults
      });

    } catch (error) {
      console.error('Error searching stocks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search stocks',
        error: error.message
      });
    }
  }

  // Get market status
  static async getMarketStatus(req, res) {
    try {
      const marketOpen = isMarketOpen();
      const refreshInterval = getRefreshInterval();
      
      res.json({
        success: true,
        data: {
          isOpen: marketOpen,
          nextRefresh: refreshInterval,
          timestamp: new Date().toISOString(),
          marketHours: marketDataConfig.refresh.marketHours
        }
      });

    } catch (error) {
      console.error('Error getting market status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get market status',
        error: error.message
      });
    }
  }

  // Private helper methods
  static async _fetchStockQuote(symbol) {
    const provider = getProviderConfig('primary');
    
    try {
      // Try primary provider (Alpha Vantage)
      const response = await axios.get(provider.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: provider.apiKey
        },
        timeout: marketDataConfig.errorHandling.timeoutMs
      });

      if (response.data['Error Message']) {
        throw new Error('Invalid symbol or API limit reached');
      }

      const quote = response.data['Global Quote'];
      if (!quote) {
        throw new Error('No data returned');
      }

      return {
        symbol: symbol.toUpperCase(),
        price: parseFloat(quote['05. price']).toFixed(marketDataConfig.dataFormat.precision.price),
        change: parseFloat(quote['09. change']).toFixed(marketDataConfig.dataFormat.precision.price),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')).toFixed(marketDataConfig.dataFormat.precision.percentage),
        high: parseFloat(quote['03. high']).toFixed(marketDataConfig.dataFormat.precision.price),
        low: parseFloat(quote['04. low']).toFixed(marketDataConfig.dataFormat.precision.price),
        volume: parseInt(quote['06. volume']),
        previousClose: parseFloat(quote['08. previous close']).toFixed(marketDataConfig.dataFormat.precision.price),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      // Try fallback provider (Yahoo Finance)
      return await MarketDataController._fetchFromYahoo(symbol);
    }
  }

  static async _fetchFromYahoo(symbol) {
    const fallbackProvider = getProviderConfig('fallback');
    
    try {
      const response = await axios.get(`${fallbackProvider.baseUrl}/${symbol}`, {
        timeout: marketDataConfig.errorHandling.timeoutMs
      });

      const result = response.data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];

      return {
        symbol: symbol.toUpperCase(),
        price: meta.regularMarketPrice.toFixed(marketDataConfig.dataFormat.precision.price),
        change: (meta.regularMarketPrice - meta.previousClose).toFixed(marketDataConfig.dataFormat.precision.price),
        changePercent: (((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100).toFixed(marketDataConfig.dataFormat.precision.percentage),
        high: meta.regularMarketDayHigh.toFixed(marketDataConfig.dataFormat.precision.price),
        low: meta.regularMarketDayLow.toFixed(marketDataConfig.dataFormat.precision.price),
        volume: meta.regularMarketVolume,
        previousClose: meta.previousClose.toFixed(marketDataConfig.dataFormat.precision.price),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Failed to fetch data for ${symbol}: ${error.message}`);
    }
  }

  static async _fetchForexRates(pairs) {
    const provider = getProviderConfig('primary');
    const rates = {};

    for (const pair of pairs) {
      try {
        const [from, to] = pair.split('/');
        const response = await axios.get(provider.baseUrl, {
          params: {
            function: 'CURRENCY_EXCHANGE_RATE',
            from_currency: from,
            to_currency: to,
            apikey: provider.apiKey
          },
          timeout: marketDataConfig.errorHandling.timeoutMs
        });

        const data = response.data['Realtime Currency Exchange Rate'];
        if (data) {
          rates[pair] = {
            rate: parseFloat(data['5. Exchange Rate']).toFixed(4),
            timestamp: data['6. Last Refreshed'],
            bidPrice: parseFloat(data['8. Bid Price']).toFixed(4),
            askPrice: parseFloat(data['9. Ask Price']).toFixed(4)
          };
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 12000)); // Alpha Vantage: 5 calls per minute

      } catch (error) {
        console.error(`Error fetching ${pair}:`, error.message);
        rates[pair] = { error: error.message };
      }
    }

    return rates;
  }

  static async _fetchCryptoPrices(coins) {
    // Using a simple approach with Alpha Vantage crypto endpoint
    const provider = getProviderConfig('primary');
    const prices = {};

    for (const coin of coins) {
      try {
        const response = await axios.get(provider.baseUrl, {
          params: {
            function: 'CURRENCY_EXCHANGE_RATE',
            from_currency: coin,
            to_currency: 'USD',
            apikey: provider.apiKey
          },
          timeout: marketDataConfig.errorHandling.timeoutMs
        });

        const data = response.data['Realtime Currency Exchange Rate'];
        if (data) {
          prices[coin] = {
            price: parseFloat(data['5. Exchange Rate']).toFixed(2),
            timestamp: data['6. Last Refreshed']
          };
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 12000));

      } catch (error) {
        console.error(`Error fetching ${coin}:`, error.message);
        prices[coin] = { error: error.message };
      }
    }

    return prices;
  }

  static async _fetchMarketIndices() {
    const indices = marketDataConfig.dataTypes.indices.major;
    const results = {};

    for (const index of indices) {
      try {
        const data = await MarketDataController._fetchFromYahoo(index);
        results[index] = data;
      } catch (error) {
        console.error(`Error fetching index ${index}:`, error.message);
        results[index] = { error: error.message };
      }
    }

    return results;
  }

  static async _searchStocks(query) {
    const provider = getProviderConfig('primary');
    
    try {
      const response = await axios.get(provider.baseUrl, {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords: query,
          apikey: provider.apiKey
        },
        timeout: marketDataConfig.errorHandling.timeoutMs
      });

      const matches = response.data.bestMatches || [];
      
      return matches.slice(0, 10).map(match => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
        marketOpen: match['5. marketOpen'],
        marketClose: match['6. marketClose'],
        timezone: match['7. timezone'],
        currency: match['8. currency']
      }));

    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }
}

module.exports = MarketDataController;