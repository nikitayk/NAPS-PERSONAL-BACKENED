const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Redis = require('ioredis');

class WebSocketError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'WebSocketError';
    this.code = code;
  }
}

class WebSocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
          'http://localhost:3000',
          'https://naps-personal.vercel.app',
          'https://naps-personal-frontend.vercel.app'
        ],
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Authorization', 'Content-Type']
      },
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000, // 25 seconds
      transports: ['websocket', 'polling'],
      maxHttpBufferSize: 1e6, // 1 MB
      connectTimeout: 45000
    });

    // Store active connections and their metadata
    this.connections = new Map();
    this.redis = new Redis(config.redis);
    this.roomStats = new Map();
    this.errorCounts = new Map(); // Track error counts per user
    this.MAX_ERRORS = 5; // Maximum errors before temporary ban
    this.ERROR_RESET_INTERVAL = 300000; // 5 minutes

    // Authentication middleware with enhanced error handling
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        if (!token) {
          throw new WebSocketError('Authentication required', 'AUTH_REQUIRED');
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        if (!decoded || !decoded.id) {
          throw new WebSocketError('Invalid token format', 'INVALID_TOKEN_FORMAT');
        }

        // Check if user is temporarily banned
        const isBanned = await this.redis.get(`banned:${decoded.id}`);
        if (isBanned) {
          throw new WebSocketError('Too many errors, try again later', 'TEMPORARY_BAN');
        }

        socket.user = decoded;
        
        // Store user's last active time with error handling
        try {
          await this.redis.hset(`user:${decoded.id}:socket`, {
            lastActive: Date.now(),
            socketId: socket.id
          });
        } catch (redisError) {
          console.error('Redis error during connection:', redisError);
          // Continue despite Redis error
        }
        
        next();
      } catch (error) {
        if (error instanceof WebSocketError) {
          next(error);
        } else if (error.name === 'JsonWebTokenError') {
          next(new WebSocketError('Invalid token', 'INVALID_TOKEN'));
        } else if (error.name === 'TokenExpiredError') {
          next(new WebSocketError('Token expired', 'TOKEN_EXPIRED'));
        } else {
          next(new WebSocketError('Internal server error', 'INTERNAL_ERROR'));
        }
      }
    });

    this.setupConnectionHandlers();
    this.startHeartbeat();
    this.startErrorCleanup();
  }

  setupConnectionHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.user.id}`);
      
      // Store connection metadata
      this.connections.set(socket.user.id, {
        socket,
        connectedAt: Date.now(),
        subscriptions: new Set(),
        lastActivity: Date.now()
      });

      // Join user-specific room
      socket.join(`user:${socket.user.id}`);
      this.updateRoomStats(`user:${socket.user.id}`, 1);

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.user.id}`);
        this.connections.delete(socket.user.id);
        await this.redis.hdel(`user:${socket.user.id}:socket`, 'socketId', 'lastActive');
        this.updateRoomStats(`user:${socket.user.id}`, -1);
      });

      // Handle subscription requests
      socket.on('subscribe', async (channels, callback) => {
        try {
          if (!Array.isArray(channels)) channels = [channels];
          
          const userConnection = this.connections.get(socket.user.id);
          for (const channel of channels) {
            const roomName = `${channel}:${socket.user.id}`;
            await socket.join(roomName);
            userConnection.subscriptions.add(channel);
            this.updateRoomStats(roomName, 1);
          }
          
          if (callback) callback({ success: true });
        } catch (error) {
          if (callback) callback({ success: false, error: error.message });
        }
      });

      // Handle unsubscribe requests
      socket.on('unsubscribe', async (channels, callback) => {
        try {
          if (!Array.isArray(channels)) channels = [channels];
          
          const userConnection = this.connections.get(socket.user.id);
          for (const channel of channels) {
            const roomName = `${channel}:${socket.user.id}`;
            await socket.leave(roomName);
            userConnection.subscriptions.delete(channel);
            this.updateRoomStats(roomName, -1);
          }
          
          if (callback) callback({ success: true });
        } catch (error) {
          if (callback) callback({ success: false, error: error.message });
        }
      });

      // Activity tracking
      socket.onAny(() => {
        const userConnection = this.connections.get(socket.user.id);
        if (userConnection) {
          userConnection.lastActivity = Date.now();
        }
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`Socket error for user ${socket.user.id}:`, error);
      });
    });
  }

  // Heartbeat to check connection health
  startHeartbeat() {
    setInterval(() => {
      const now = Date.now();
      this.connections.forEach((connection, userId) => {
        if (now - connection.lastActivity > 120000) { // 2 minutes
          console.log(`Inactive connection detected for user ${userId}`);
          this.disconnectUser(userId);
        }
      });
    }, 60000); // Check every minute
  }

  // Room statistics tracking
  updateRoomStats(room, delta) {
    const current = this.roomStats.get(room) || 0;
    this.roomStats.set(room, current + delta);
  }

  // Enhanced error tracking
  async incrementErrorCount(userId) {
    const currentCount = (this.errorCounts.get(userId) || 0) + 1;
    this.errorCounts.set(userId, currentCount);

    if (currentCount >= this.MAX_ERRORS) {
      await this.temporarilyBanUser(userId);
    }
  }

  async temporarilyBanUser(userId) {
    await this.redis.set(`banned:${userId}`, '1', 'EX', 300); // 5 minute ban
    await this.disconnectUser(userId);
  }

  startErrorCleanup() {
    setInterval(() => {
      this.errorCounts.clear();
    }, this.ERROR_RESET_INTERVAL);
  }

  // Enhanced validation
  validateSubscriptionRequest(channels) {
    if (!Array.isArray(channels)) {
      throw new WebSocketError('Channels must be an array', 'INVALID_FORMAT');
    }

    if (channels.some(channel => !channel || typeof channel !== 'string')) {
      throw new WebSocketError('Invalid channel format', 'INVALID_CHANNEL');
    }

    if (channels.length > 50) {
      throw new WebSocketError('Too many channels requested', 'CHANNEL_LIMIT_EXCEEDED');
    }

    return true;
  }

  // Enhanced event sending with validation
  async sendToUser(userId, eventName, data) {
    try {
      if (!userId || !eventName) {
        throw new WebSocketError('Missing required parameters', 'INVALID_PARAMS');
      }

      const userConnection = this.connections.get(userId);
      if (!userConnection) {
        return false;
      }

      const eventData = {
        type: eventName,
        data,
        timestamp: Date.now()
      };

      await new Promise((resolve, reject) => {
        userConnection.socket.emit(eventName, eventData, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      return true;
    } catch (error) {
      console.error(`Error sending event to user ${userId}:`, error);
      await this.incrementErrorCount(userId);
      return false;
    }
  }

  // Enhanced subscription handling
  async handleSubscription(socket, channels, callback) {
    try {
      this.validateSubscriptionRequest(channels);
      
      const userConnection = this.connections.get(socket.user.id);
      if (!userConnection) {
        throw new WebSocketError('User not connected', 'NOT_CONNECTED');
      }

      for (const channel of channels) {
        const roomName = `${channel}:${socket.user.id}`;
        await socket.join(roomName);
        userConnection.subscriptions.add(channel);
        this.updateRoomStats(roomName, 1);
      }
      
      if (callback) callback({ success: true });
    } catch (error) {
      console.error(`Subscription error for user ${socket.user.id}:`, error);
      await this.incrementErrorCount(socket.user.id);
      if (callback) callback({ 
        success: false, 
        error: error.message,
        code: error instanceof WebSocketError ? error.code : 'INTERNAL_ERROR'
      });
    }
  }

  // Send fraud alert
  async sendFraudAlert(userId, alert) {
    return this.sendToUser(userId, 'fraud-alert', alert);
  }

  // Send achievement notification
  async sendAchievementNotification(userId, achievement) {
    return this.sendToUser(userId, 'achievement-unlocked', achievement);
  }

  // Send learning update
  async sendLearningUpdate(userId, update) {
    return this.sendToUser(userId, 'learning-update', update);
  }

  // Send transaction update
  async sendTransactionUpdate(userId, transaction) {
    return this.sendToUser(userId, 'transaction-update', transaction);
  }

  // Send quest update
  async sendQuestUpdate(userId, quest) {
    return this.sendToUser(userId, 'quest-update', quest);
  }

  // Broadcast to all users
  async broadcastAnnouncement(announcement) {
    this.io.emit('system-announcement', {
      type: 'ANNOUNCEMENT',
      data: announcement,
      timestamp: Date.now()
    });
  }

  // Get connection statistics
  getStats() {
    return {
      totalConnections: this.connections.size,
      roomStats: Object.fromEntries(this.roomStats),
      uptime: process.uptime()
    };
  }

  // Check if user is connected
  isUserConnected(userId) {
    return this.connections.has(userId);
  }

  // Get user's active subscriptions
  getUserSubscriptions(userId) {
    const connection = this.connections.get(userId);
    return connection ? Array.from(connection.subscriptions) : [];
  }

  // Disconnect specific user
  async disconnectUser(userId) {
    const connection = this.connections.get(userId);
    if (connection) {
      connection.socket.disconnect(true);
      this.connections.delete(userId);
      await this.redis.hdel(`user:${userId}:socket`, 'socketId', 'lastActive');
    }
  }

  // Enhanced cleanup with error handling
  async cleanup() {
    try {
      const disconnectPromises = Array.from(this.connections.entries()).map(
        async ([userId, connection]) => {
          try {
            await this.disconnectUser(userId);
          } catch (error) {
            console.error(`Error disconnecting user ${userId}:`, error);
          }
        }
      );

      await Promise.all(disconnectPromises);
      await this.redis.quit();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

module.exports = WebSocketService; 