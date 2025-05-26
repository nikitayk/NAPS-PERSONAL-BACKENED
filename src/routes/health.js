const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Redis = require('ioredis');
const config = require('../config/config');
const { getWebSocketService } = require('../config/websocket');

// Initialize Redis client
const redis = new Redis(config.redis);

/**
 * @route GET /api/v1/health
 * @description Get system health status
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const wsService = getWebSocketService();
    const wsStats = wsService.getStats();

    const healthCheck = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      status: 'OK',
      services: {
        database: {
          status: 'OK',
          latency: 0
        },
        redis: {
          status: 'OK',
          latency: 0
        },
        websocket: {
          status: 'OK',
          connections: wsStats.totalConnections,
          roomStats: wsStats.roomStats
        },
        api: {
          status: 'OK'
        }
      },
      memory: {
        total: process.memoryUsage().heapTotal,
        used: process.memoryUsage().heapUsed,
        external: process.memoryUsage().external
      },
      cpu: {
        load: process.cpuUsage()
      }
    };

    // Check database connection
    const dbStart = Date.now();
    const dbStatus = mongoose.connection.readyState;
    healthCheck.services.database.latency = Date.now() - dbStart;
    healthCheck.services.database.status = dbStatus === 1 ? 'OK' : 'ERROR';

    // Check Redis connection
    const redisStart = Date.now();
    await redis.ping();
    healthCheck.services.redis.latency = Date.now() - redisStart;

    // Overall status
    healthCheck.status = Object.values(healthCheck.services).every(
      service => service.status === 'OK'
    ) ? 'OK' : 'ERROR';

    // Add version information
    healthCheck.version = {
      node: process.version,
      app: process.env.npm_package_version || '2.0.0'
    };

    // Response headers for monitoring systems
    res.set({
      'Cache-Control': 'no-cache',
      'Correlation-Id': req.headers['x-correlation-id'] || Date.now().toString(),
      'Service-Name': 'naps-backend'
    });

    res.status(healthCheck.status === 'OK' ? 200 : 503).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: Date.now(),
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/health/deep
 * @description Get detailed system health status
 * @access Private
 */
router.get('/deep', async (req, res) => {
  try {
    const wsService = getWebSocketService();
    const wsStats = wsService.getStats();

    const deepHealth = {
      timestamp: Date.now(),
      status: 'OK',
      components: {
        database: {
          status: 'OK',
          details: {
            connections: mongoose.connection.base.connections.length,
            collections: Object.keys(mongoose.connection.collections).length,
            readyState: mongoose.connection.readyState
          }
        },
        redis: {
          status: 'OK',
          details: await redis.info()
        },
        websocket: {
          status: 'OK',
          details: {
            connections: wsStats.totalConnections,
            rooms: wsStats.roomStats,
            uptime: wsStats.uptime
          }
        },
        system: {
          status: 'OK',
          details: {
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            uptime: process.uptime(),
            env: process.env.NODE_ENV,
            pid: process.pid
          }
        }
      },
      metrics: {
        activeConnections: wsStats.totalConnections,
        pendingRequests: getPendingRequests(),
        errorRate: getErrorRate()
      }
    };

    res.status(200).json(deepHealth);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: Date.now(),
      error: error.message
    });
  }
});

// Helper functions
function getPendingRequests() {
  // Implementation depends on your request tracking
  return 0;
}

function getErrorRate() {
  // Implementation depends on your error tracking
  return 0;
}

module.exports = router; 