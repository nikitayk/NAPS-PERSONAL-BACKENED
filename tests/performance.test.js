const request = require('supertest');
const { io } = require('socket.io-client');
const app = require('../src/app');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const config = require('../src/config/config');

// Performance thresholds
const THRESHOLDS = {
  API_RESPONSE_TIME: 200, // 200ms
  DB_QUERY_TIME: 100,    // 100ms
  WEBSOCKET_RESPONSE: 50, // 50ms
  REDIS_OPERATION: 20,    // 20ms
};

describe('Performance Tests', () => {
  let redis;

  beforeAll(async () => {
    redis = new Redis(config.redis);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await redis.quit();
  });

  // API Response Time Tests
  describe('API Response Times', () => {
    it('should respond to health check within threshold', async () => {
      const start = Date.now();
      await request(app).get('/api/v1/health');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(THRESHOLDS.API_RESPONSE_TIME);
    });

    it('should handle authentication requests quickly', async () => {
      const start = Date.now();
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'password' });
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(THRESHOLDS.API_RESPONSE_TIME);
    });

    // Test concurrent requests
    it('should handle multiple concurrent requests efficiently', async () => {
      const numberOfRequests = 50;
      const requests = Array(numberOfRequests).fill().map(() => 
        request(app).get('/api/v1/health')
      );
      
      const start = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - start;
      
      const averageTime = duration / numberOfRequests;
      expect(averageTime).toBeLessThan(THRESHOLDS.API_RESPONSE_TIME);
    });
  });

  // Database Performance Tests
  describe('Database Performance', () => {
    it('should perform quick database queries', async () => {
      const User = mongoose.model('User');
      
      const start = Date.now();
      await User.findOne().lean();
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(THRESHOLDS.DB_QUERY_TIME);
    });

    it('should handle bulk operations efficiently', async () => {
      const User = mongoose.model('User');
      const numberOfOperations = 100;
      
      const start = Date.now();
      await User.find().limit(numberOfOperations).lean();
      const duration = Date.now() - start;
      
      const averageTime = duration / numberOfOperations;
      expect(averageTime).toBeLessThan(THRESHOLDS.DB_QUERY_TIME);
    });
  });

  // Redis Cache Performance Tests
  describe('Redis Cache Performance', () => {
    it('should perform quick cache operations', async () => {
      const start = Date.now();
      await redis.set('test-key', 'test-value');
      await redis.get('test-key');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(THRESHOLDS.REDIS_OPERATION);
    });

    it('should handle bulk cache operations efficiently', async () => {
      const pipeline = redis.pipeline();
      const numberOfOperations = 100;
      
      for (let i = 0; i < numberOfOperations; i++) {
        pipeline.set(`key${i}`, `value${i}`);
      }
      
      const start = Date.now();
      await pipeline.exec();
      const duration = Date.now() - start;
      
      const averageTime = duration / numberOfOperations;
      expect(averageTime).toBeLessThan(THRESHOLDS.REDIS_OPERATION);
    });
  });

  // WebSocket Performance Tests
  describe('WebSocket Performance', () => {
    let socket;
    let token = 'test-token'; // You should generate a valid token

    beforeEach((done) => {
      socket = io(`http://localhost:${config.port}`, {
        auth: { token },
        transports: ['websocket']
      });
      socket.on('connect', done);
    });

    afterEach(() => {
      if (socket.connected) {
        socket.disconnect();
      }
    });

    it('should handle real-time updates quickly', (done) => {
      const start = Date.now();
      
      socket.emit('subscribe:transactions', {}, () => {
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(THRESHOLDS.WEBSOCKET_RESPONSE);
        done();
      });
    });

    it('should maintain low latency under load', (done) => {
      const numberOfMessages = 50;
      let received = 0;
      const times = [];
      
      socket.on('test-event', (timestamp) => {
        times.push(Date.now() - timestamp);
        received++;
        
        if (received === numberOfMessages) {
          const averageLatency = times.reduce((a, b) => a + b) / times.length;
          expect(averageLatency).toBeLessThan(THRESHOLDS.WEBSOCKET_RESPONSE);
          done();
        }
      });

      // Send multiple messages
      for (let i = 0; i < numberOfMessages; i++) {
        socket.emit('echo', Date.now());
      }
    });
  });

  // Memory Usage Tests
  describe('Memory Usage', () => {
    it('should maintain stable memory usage under load', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate heavy load
      const numberOfRequests = 1000;
      const requests = Array(numberOfRequests).fill().map(() => 
        request(app).get('/api/v1/health')
      );
      
      await Promise.all(requests);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
      
      expect(memoryIncrease).toBeLessThan(50); // Should not increase by more than 50MB
    });
  });
});

// Load Testing Configuration
const loadTest = {
  scenarios: {
    constant_load: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 100,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% can fail
  },
};

module.exports = { loadTest }; 