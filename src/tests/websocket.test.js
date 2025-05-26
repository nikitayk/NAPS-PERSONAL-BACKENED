const { createServer } = require('http');
const { io: Client } = require('socket.io-client');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis-mock');
const WebSocketService = require('../services/websocketService');
const config = require('../config/config');

describe('WebSocket Service Tests', () => {
  let httpServer;
  let wsService;
  let clientSocket;
  let port;
  
  const mockUserId = '123';
  const mockToken = jwt.sign({ id: mockUserId }, config.jwt.secret);

  beforeAll((done) => {
    httpServer = createServer();
    wsService = new WebSocketService(httpServer);
    wsService.redis = new Redis(); // Use Redis mock for tests
    port = 3001;
    httpServer.listen(port, done);
  });

  afterAll(async () => {
    await wsService.cleanup();
    httpServer.close();
  });

  beforeEach((done) => {
    clientSocket = new Client(`http://localhost:${port}`, {
      auth: { token: mockToken },
      transports: ['websocket']
    });
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Connection Management', () => {
    test('should connect with valid token', (done) => {
      expect(clientSocket.connected).toBe(true);
      expect(wsService.isUserConnected(mockUserId)).toBe(true);
      done();
    });

    test('should reject connection with invalid token', (done) => {
      const invalidSocket = new Client(`http://localhost:${port}`, {
        auth: { token: 'invalid-token' },
        transports: ['websocket']
      });

      invalidSocket.on('connect_error', (err) => {
        expect(err.message).toBe('Invalid token');
        invalidSocket.disconnect();
        done();
      });
    });

    test('should handle disconnection properly', (done) => {
      clientSocket.disconnect();
      setTimeout(() => {
        expect(wsService.isUserConnected(mockUserId)).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Subscription Management', () => {
    test('should handle channel subscription', (done) => {
      clientSocket.emit('subscribe', ['transactions'], (response) => {
        expect(response.success).toBe(true);
        const subs = wsService.getUserSubscriptions(mockUserId);
        expect(subs).toContain('transactions');
        done();
      });
    });

    test('should handle multiple channel subscriptions', (done) => {
      const channels = ['transactions', 'fraud-alerts', 'achievements'];
      clientSocket.emit('subscribe', channels, (response) => {
        expect(response.success).toBe(true);
        const subs = wsService.getUserSubscriptions(mockUserId);
        channels.forEach(channel => {
          expect(subs).toContain(channel);
        });
        done();
      });
    });

    test('should handle unsubscribe requests', (done) => {
      clientSocket.emit('subscribe', ['transactions'], () => {
        clientSocket.emit('unsubscribe', ['transactions'], (response) => {
          expect(response.success).toBe(true);
          const subs = wsService.getUserSubscriptions(mockUserId);
          expect(subs).not.toContain('transactions');
          done();
        });
      });
    });
  });

  describe('Event Broadcasting', () => {
    test('should send events to specific user', (done) => {
      const testData = { message: 'test' };
      clientSocket.on('test-event', (data) => {
        expect(data.data).toEqual(testData);
        expect(data.type).toBe('test-event');
        expect(data.timestamp).toBeDefined();
        done();
      });
      wsService.sendToUser(mockUserId, 'test-event', testData);
    });

    test('should broadcast announcements to all users', (done) => {
      const announcement = { message: 'System maintenance' };
      clientSocket.on('system-announcement', (data) => {
        expect(data.data).toEqual(announcement);
        expect(data.type).toBe('ANNOUNCEMENT');
        expect(data.timestamp).toBeDefined();
        done();
      });
      wsService.broadcastAnnouncement(announcement);
    });
  });

  describe('Specific Event Types', () => {
    test('should handle fraud alerts', (done) => {
      const alert = { type: 'suspicious_transaction', details: 'Test alert' };
      clientSocket.on('fraud-alert', (data) => {
        expect(data.data).toEqual(alert);
        done();
      });
      wsService.sendFraudAlert(mockUserId, alert);
    });

    test('should handle achievement notifications', (done) => {
      const achievement = { name: 'First Transaction', points: 100 };
      clientSocket.on('achievement-unlocked', (data) => {
        expect(data.data).toEqual(achievement);
        done();
      });
      wsService.sendAchievementNotification(mockUserId, achievement);
    });

    test('should handle learning updates', (done) => {
      const update = { course: 'Finance 101', progress: 75 };
      clientSocket.on('learning-update', (data) => {
        expect(data.data).toEqual(update);
        done();
      });
      wsService.sendLearningUpdate(mockUserId, update);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid event data', async () => {
      const result = await wsService.sendToUser(mockUserId, 'test-event', undefined);
      expect(result).toBe(true); // Should still send, just with undefined data
    });

    test('should handle sending to non-existent user', async () => {
      const result = await wsService.sendToUser('non-existent', 'test-event', {});
      expect(result).toBe(false);
    });

    test('should handle subscription to invalid channel', (done) => {
      clientSocket.emit('subscribe', [null], (response) => {
        expect(response.success).toBe(false);
        done();
      });
    });
  });

  describe('Performance and Load', () => {
    test('should handle rapid event emissions', async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(wsService.sendToUser(mockUserId, 'test-event', { count: i }));
      }
      const results = await Promise.all(promises);
      expect(results.every(r => r === true)).toBe(true);
    });

    test('should handle multiple subscriptions and unsubscriptions', (done) => {
      const channels = Array.from({ length: 50 }, (_, i) => `channel-${i}`);
      clientSocket.emit('subscribe', channels, (response) => {
        expect(response.success).toBe(true);
        clientSocket.emit('unsubscribe', channels, (response2) => {
          expect(response2.success).toBe(true);
          done();
        });
      });
    });
  });
}); 