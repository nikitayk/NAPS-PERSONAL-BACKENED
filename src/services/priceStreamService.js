const WebSocket = require('ws');
const EventEmitter = require('events');
const axios = require('axios');

class PriceStreamService extends EventEmitter {
    constructor(io) {
        super();
        this.io = io; // Socket.io instance
        this.connections = new Map(); // Store active WebSocket connections
        this.subscriptions = new Map(); // Track symbol subscriptions
        this.priceCache = new Map(); // Cache latest prices
        this.reconnectAttempts = new Map();
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.isRunning = false;
        this.intervalIds = new Map(); // Store polling intervals
        
        // Data source configurations
        this.dataSources = {
            FINNHUB: {
                ws: 'wss://ws.finnhub.io',
                rest: 'https://finnhub.io/api/v1'
            },
            POLYGON: {
                ws: 'wss://socket.polygon.io/stocks',
                rest: 'https://api.polygon.io/v2'
            },
            BINANCE: {
                ws: 'wss://stream.binance.com:9443/ws',
                rest: 'https://api.binance.com/api/v3'
            },
            ALPHA_VANTAGE: {
                rest: 'https://www.alphavantage.co/query'
            }
        };
        
        this.apiKeys = {
            FINNHUB: process.env.FINNHUB_API_KEY,
            POLYGON: process.env.POLYGON_API_KEY,
            ALPHA_VANTAGE: process.env.ALPHA_VANTAGE_API_KEY,
            BINANCE: null // Public API
        };
        
        this.setupSocketHandlers();
    }

    // Initialize Socket.io handlers
    setupSocketHandlers() {
        if (!this.io) return;
        
        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);
            
            // Send cached prices to new client
            this.sendCachedPrices(socket);
            
            // Handle symbol subscription
            socket.on('subscribe', (data) => {
                const { symbols, source = 'FINNHUB' } = data;
                this.subscribeToSymbols(symbols, source, socket.id);
            });
            
            // Handle symbol unsubscription
            socket.on('unsubscribe', (data) => {
                const { symbols } = data;
                this.unsubscribeFromSymbols(symbols, socket.id);
            });
            
            // Handle client disconnect
            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
                this.cleanupClientSubscriptions(socket.id);
            });
        });
    }

    // Subscribe to price updates for symbols
    async subscribeToSymbols(symbols, source, clientId) {
        if (!Array.isArray(symbols)) symbols = [symbols];
        
        for (const symbol of symbols) {
            try {
                // Track subscription
                if (!this.subscriptions.has(symbol)) {
                    this.subscriptions.set(symbol, new Set());
                }
                this.subscriptions.get(symbol).add(clientId);
                
                // Start streaming for this symbol if not already active
                await this.startPriceStream(symbol, source);
                
                console.log(`Subscribed ${clientId} to ${symbol} via ${source}`);
            } catch (error) {
                console.error(`Error subscribing to ${symbol}:`, error);
                this.io.to(clientId).emit('error', {
                    message: `Failed to subscribe to ${symbol}`,
                    symbol,
                    error: error.message
                });
            }
        }
    }

    // Unsubscribe from symbols
    unsubscribeFromSymbols(symbols, clientId) {
        if (!Array.isArray(symbols)) symbols = [symbols];
        
        for (const symbol of symbols) {
            if (this.subscriptions.has(symbol)) {
                this.subscriptions.get(symbol).delete(clientId);
                
                // If no more subscribers, stop the stream
                if (this.subscriptions.get(symbol).size === 0) {
                    this.stopPriceStream(symbol);
                }
            }
        }
    }

    // Start price streaming for a symbol
    async startPriceStream(symbol, source) {
        const streamKey = `${symbol}-${source}`;
        
        // Don't start if already streaming
        if (this.connections.has(streamKey)) return;
        
        switch (source) {
            case 'FINNHUB':
                await this.startFinnhubStream(symbol);
                break;
            case 'POLYGON':
                await this.startPolygonStream(symbol);
                break;
            case 'BINANCE':
                await this.startBinanceStream(symbol);
                break;
            case 'ALPHA_VANTAGE':
                await this.startAlphaVantagePolling(symbol);
                break;
            default:
                throw new Error(`Unsupported data source: ${source}`);
        }
    }

    // Finnhub WebSocket implementation
    async startFinnhubStream(symbol) {
        const apiKey = this.apiKeys.FINNHUB;
        if (!apiKey) throw new Error('Finnhub API key not configured');
        
        const ws = new WebSocket(`${this.dataSources.FINNHUB.ws}?token=${apiKey}`);
        const streamKey = `${symbol}-FINNHUB`;
        
        ws.on('open', () => {
            console.log(`Finnhub WebSocket connected for ${symbol}`);
            ws.send(JSON.stringify({ type: 'subscribe', symbol }));
            this.connections.set(streamKey, ws);
            this.reconnectAttempts.set(streamKey, 0);
        });
        
        ws.on('message', (data) => {
            try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'trade') {
                    for (const trade of parsed.data) {
                        this.processPriceUpdate({
                            symbol: trade.s,
                            price: trade.p,
                            volume: trade.v,
                            timestamp: trade.t,
                            source: 'FINNHUB'
                        });
                    }
                }
            } catch (error) {
                console.error('Error parsing Finnhub message:', error);
            }
        });
        
        ws.on('error', (error) => {
            console.error(`Finnhub WebSocket error for ${symbol}:`, error);
            this.handleReconnection(streamKey, symbol, 'FINNHUB');
        });
        
        ws.on('close', () => {
            console.log(`Finnhub WebSocket closed for ${symbol}`);
            this.connections.delete(streamKey);
            this.handleReconnection(streamKey, symbol, 'FINNHUB');
        });
    }

    // Polygon WebSocket implementation
    async startPolygonStream(symbol) {
        const apiKey = this.apiKeys.POLYGON;
        if (!apiKey) throw new Error('Polygon API key not configured');
        
        const ws = new WebSocket(this.dataSources.POLYGON.ws);
        const streamKey = `${symbol}-POLYGON`;
        
        ws.on('open', () => {
            console.log(`Polygon WebSocket connected for ${symbol}`);
            ws.send(JSON.stringify({
                action: 'auth',
                params: apiKey
            }));
            
            setTimeout(() => {
                ws.send(JSON.stringify({
                    action: 'subscribe',
                    params: `T.${symbol}`
                }));
            }, 1000);
            
            this.connections.set(streamKey, ws);
            this.reconnectAttempts.set(streamKey, 0);
        });
        
        ws.on('message', (data) => {
            try {
                const messages = JSON.parse(data);
                for (const msg of messages) {
                    if (msg.ev === 'T') { // Trade event
                        this.processPriceUpdate({
                            symbol: msg.sym,
                            price: msg.p,
                            volume: msg.s,
                            timestamp: msg.t,
                            source: 'POLYGON'
                        });
                    }
                }
            } catch (error) {
                console.error('Error parsing Polygon message:', error);
            }
        });
        
        ws.on('error', (error) => {
            console.error(`Polygon WebSocket error for ${symbol}:`, error);
            this.handleReconnection(streamKey, symbol, 'POLYGON');
        });
        
        ws.on('close', () => {
            console.log(`Polygon WebSocket closed for ${symbol}`);
            this.connections.delete(streamKey);
            this.handleReconnection(streamKey, symbol, 'POLYGON');
        });
    }

    // Binance WebSocket implementation
    async startBinanceStream(symbol) {
        const wsSymbol = symbol.toLowerCase();
        const ws = new WebSocket(`${this.dataSources.BINANCE.ws}/${wsSymbol}@ticker`);
        const streamKey = `${symbol}-BINANCE`;
        
        ws.on('open', () => {
            console.log(`Binance WebSocket connected for ${symbol}`);
            this.connections.set(streamKey, ws);
            this.reconnectAttempts.set(streamKey, 0);
        });
        
        ws.on('message', (data) => {
            try {
                const ticker = JSON.parse(data);
                this.processPriceUpdate({
                    symbol: ticker.s,
                    price: parseFloat(ticker.c),
                    volume: parseFloat(ticker.v),
                    change: parseFloat(ticker.P),
                    timestamp: ticker.E,
                    source: 'BINANCE'
                });
            } catch (error) {
                console.error('Error parsing Binance message:', error);
            }
        });
        
        ws.on('error', (error) => {
            console.error(`Binance WebSocket error for ${symbol}:`, error);
            this.handleReconnection(streamKey, symbol, 'BINANCE');
        });
        
        ws.on('close', () => {
            console.log(`Binance WebSocket closed for ${symbol}`);
            this.connections.delete(streamKey);
            this.handleReconnection(streamKey, symbol, 'BINANCE');
        });
    }

    // Alpha Vantage polling implementation
    async startAlphaVantagePolling(symbol) {
        const apiKey = this.apiKeys.ALPHA_VANTAGE;
        if (!apiKey) throw new Error('Alpha Vantage API key not configured');
        
        const streamKey = `${symbol}-ALPHA_VANTAGE`;
        
        const poll = async () => {
            try {
                const response = await axios.get(this.dataSources.ALPHA_VANTAGE.rest, {
                    params: {
                        function: 'GLOBAL_QUOTE',
                        symbol: symbol,
                        apikey: apiKey
                    }
                });
                
                const quote = response.data['Global Quote'];
                if (quote) {
                    this.processPriceUpdate({
                        symbol: quote['01. symbol'],
                        price: parseFloat(quote['05. price']),
                        change: parseFloat(quote['09. change']),
                        changePercent: quote['10. change percent'],
                        timestamp: Date.now(),
                        source: 'ALPHA_VANTAGE'
                    });
                }
            } catch (error) {
                console.error(`Alpha Vantage polling error for ${symbol}:`, error);
            }
        };
        
        // Poll every 60 seconds (Alpha Vantage rate limit)
        const intervalId = setInterval(poll, 60000);
        this.intervalIds.set(streamKey, intervalId);
        
        // Initial poll
        await poll();
        
        console.log(`Started Alpha Vantage polling for ${symbol}`);
    }

    // Process and broadcast price updates
    processPriceUpdate(data) {
        const { symbol, price, volume, change, changePercent, timestamp, source } = data;
        
        // Cache the latest price
        this.priceCache.set(symbol, {
            symbol,
            price,
            volume,
            change,
            changePercent,
            timestamp,
            source,
            lastUpdated: Date.now()
        });
        
        // Broadcast to subscribed clients
        if (this.subscriptions.has(symbol)) {
            const clients = Array.from(this.subscriptions.get(symbol));
            const priceData = this.priceCache.get(symbol);
            
            clients.forEach(clientId => {
                this.io.to(clientId).emit('priceUpdate', priceData);
            });
        }
        
        // Emit event for other services
        this.emit('priceUpdate', this.priceCache.get(symbol));
    }

    // Handle WebSocket reconnection
    handleReconnection(streamKey, symbol, source) {
        const attempts = this.reconnectAttempts.get(streamKey) || 0;
        
        if (attempts < this.maxReconnectAttempts) {
            const delay = this.reconnectDelay * Math.pow(2, attempts);
            
            setTimeout(() => {
                console.log(`Reconnecting ${symbol} (${source}) - Attempt ${attempts + 1}`);
                this.reconnectAttempts.set(streamKey, attempts + 1);
                this.startPriceStream(symbol, source);
            }, delay);
        } else {
            console.error(`Max reconnection attempts reached for ${symbol} (${source})`);
            this.reconnectAttempts.delete(streamKey);
        }
    }

    // Send cached prices to a specific client
    sendCachedPrices(socket) {
        this.priceCache.forEach((priceData) => {
            socket.emit('priceUpdate', priceData);
        });
    }

    // Stop price stream for a symbol
    stopPriceStream(symbol) {
        // Close WebSocket connections
        this.connections.forEach((ws, streamKey) => {
            if (streamKey.startsWith(symbol)) {
                ws.close();
                this.connections.delete(streamKey);
            }
        });
        
        // Clear polling intervals
        this.intervalIds.forEach((intervalId, streamKey) => {
            if (streamKey.startsWith(symbol)) {
                clearInterval(intervalId);
                this.intervalIds.delete(streamKey);
            }
        });
        
        // Remove from subscriptions
        this.subscriptions.delete(symbol);
        
        console.log(`Stopped price stream for ${symbol}`);
    }

    // Clean up subscriptions for disconnected client
    cleanupClientSubscriptions(clientId) {
        this.subscriptions.forEach((clients, symbol) => {
            clients.delete(clientId);
            if (clients.size === 0) {
                this.stopPriceStream(symbol);
            }
        });
    }

    // Get current price for a symbol
    getCurrentPrice(symbol) {
        return this.priceCache.get(symbol);
    }

    // Get all cached prices
    getAllPrices() {
        return Array.from(this.priceCache.values());
    }

    // REST API endpoints for manual price fetching
    async fetchPrice(symbol, source = 'FINNHUB') {
        try {
            switch (source) {
                case 'FINNHUB':
                    return await this.fetchFinnhubPrice(symbol);
                case 'ALPHA_VANTAGE':
                    return await this.fetchAlphaVantagePrice(symbol);
                case 'BINANCE':
                    return await this.fetchBinancePrice(symbol);
                default:
                    throw new Error(`Unsupported source: ${source}`);
            }
        } catch (error) {
            console.error(`Error fetching price for ${symbol}:`, error);
            throw error;
        }
    }

    async fetchFinnhubPrice(symbol) {
        const response = await axios.get(`${this.dataSources.FINNHUB.rest}/quote`, {
            params: {
                symbol: symbol,
                token: this.apiKeys.FINNHUB
            }
        });
        
        return {
            symbol,
            price: response.data.c,
            change: response.data.d,
            changePercent: response.data.dp,
            high: response.data.h,
            low: response.data.l,
            open: response.data.o,
            previousClose: response.data.pc,
            timestamp: response.data.t * 1000,
            source: 'FINNHUB'
        };
    }

    async fetchAlphaVantagePrice(symbol) {
        const response = await axios.get(this.dataSources.ALPHA_VANTAGE.rest, {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol: symbol,
                apikey: this.apiKeys.ALPHA_VANTAGE
            }
        });
        
        const quote = response.data['Global Quote'];
        return {
            symbol: quote['01. symbol'],
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: quote['10. change percent'],
            high: parseFloat(quote['03. high']),
            low: parseFloat(quote['04. low']),
            open: parseFloat(quote['02. open']),
            previousClose: parseFloat(quote['08. previous close']),
            volume: parseInt(quote['06. volume']),
            timestamp: Date.now(),
            source: 'ALPHA_VANTAGE'
        };
    }

    async fetchBinancePrice(symbol) {
        const response = await axios.get(`${this.dataSources.BINANCE.rest}/ticker/24hr`, {
            params: { symbol: symbol.toUpperCase() }
        });
        
        return {
            symbol: response.data.symbol,
            price: parseFloat(response.data.lastPrice),
            change: parseFloat(response.data.priceChange),
            changePercent: parseFloat(response.data.priceChangePercent),
            high: parseFloat(response.data.highPrice),
            low: parseFloat(response.data.lowPrice),
            open: parseFloat(response.data.openPrice),
            volume: parseFloat(response.data.volume),
            timestamp: response.data.closeTime,
            source: 'BINANCE'
        };
    }

    // Start the service
    start() {
        this.isRunning = true;
        console.log('Price Stream Service started');
    }

    // Stop the service
    stop() {
        this.isRunning = false;
        
        // Close all WebSocket connections
        this.connections.forEach(ws => ws.close());
        this.connections.clear();
        
        // Clear all intervals
        this.intervalIds.forEach(intervalId => clearInterval(intervalId));
        this.intervalIds.clear();
        
        // Clear subscriptions
        this.subscriptions.clear();
        
        console.log('Price Stream Service stopped');
    }

    // Health check
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeConnections: this.connections.size,
            activeSubscriptions: this.subscriptions.size,
            cachedPrices: this.priceCache.size,
            lastUpdated: Date.now()
        };
    }
}

module.exports = PriceStreamService;