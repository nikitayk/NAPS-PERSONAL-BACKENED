import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import ws from 'k6/ws';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const websocketErrors = new Counter('websocket_errors');
const messagesSent = new Counter('messages_sent');
const messagesReceived = new Counter('messages_received');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 500 }, // Ramp up to 500 users
    { duration: '1m', target: 500 },  // Stay at 500 users
    { duration: '30s', target: 1000 }, // Ramp up to 1000 users
    { duration: '1m', target: 1000 },  // Stay at 1000 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    'websocket_errors': ['count<100'],
    'messages_sent': ['count>1000'],
    'messages_received': ['count>1000'],
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'ws_connecting_duration': ['p(95)<1000'], // 95% of WS connections should be below 1s
    'ws_session_duration': ['p(95)>10000'], // 95% of WS sessions should last more than 10s
  },
};

// Simulate user behavior
export default function () {
  // Get JWT token (simulated)
  const userId = randomString(8);
  const token = `simulated-token-${userId}`;

  // WebSocket connection with error handling
  const wsUrl = 'ws://localhost:5000';
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };

  const wsResponse = ws.connect(wsUrl, params, function (socket) {
    socket.on('open', () => {
      console.log('Connected to WebSocket');

      // Subscribe to channels
      socket.send(JSON.stringify({
        event: 'subscribe',
        channels: ['transactions', 'fraud-alerts', 'achievements']
      }));

      // Send messages periodically
      const interval = setInterval(() => {
        try {
          socket.send(JSON.stringify({
            event: 'test-event',
            data: { message: 'Load test message' }
          }));
          messagesSent.add(1);
        } catch (e) {
          websocketErrors.add(1);
          console.error('Error sending message:', e);
        }
      }, 1000);

      // Handle incoming messages
      socket.on('message', (data) => {
        messagesReceived.add(1);
      });

      // Handle errors
      socket.on('error', (e) => {
        websocketErrors.add(1);
        console.error('WebSocket error:', e);
      });

      // Cleanup on close
      socket.on('close', () => {
        clearInterval(interval);
      });
    });
  });

  check(wsResponse, { 'Connected successfully': (r) => r && r.status === 101 });

  // Keep the connection alive for the test duration
  sleep(Math.random() * 60 + 30); // Random duration between 30-90 seconds
}

// Custom setup
export function setup() {
  // Perform any necessary setup
  const response = http.get('http://localhost:5000/health');
  check(response, {
    'Health check passed': (r) => r.status === 200,
  });
}

// Custom teardown
export function teardown(data) {
  // Cleanup after tests
  console.log('Test completed');
}

// Custom metrics reporting
export function handleSummary(data) {
  return {
    'stdout': JSON.stringify({
      'websocket_errors': data.metrics.websocket_errors.values.count,
      'messages_sent': data.metrics.messages_sent.values.count,
      'messages_received': data.metrics.messages_received.values.count,
      'ws_connecting_duration_p95': data.metrics.ws_connecting_duration.values['p(95)'],
      'ws_session_duration_p95': data.metrics.ws_session_duration.values['p(95)'],
    }, null, 2),
  };
} 