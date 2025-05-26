const WebSocketService = require('../services/websocketService');
const http = require('http');

let wsService = null;

const initializeWebSocket = (app) => {
  // Create HTTP server
  const server = http.createServer(app);
  
  // Initialize WebSocket service
  wsService = new WebSocketService(server);
  
  // Add WebSocket service to app for use in routes
  app.set('wsService', wsService);
  
  return server;
};

const getWebSocketService = () => {
  if (!wsService) {
    throw new Error('WebSocket service not initialized');
  }
  return wsService;
};

// Graceful shutdown handler
const cleanup = async () => {
  if (wsService) {
    await wsService.cleanup();
    wsService = null;
  }
};

module.exports = {
  initializeWebSocket,
  getWebSocketService,
  cleanup
}; 