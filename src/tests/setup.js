const Redis = require('ioredis-mock');

// Mock Redis
jest.mock('ioredis', () => require('ioredis-mock'));

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Silence console logs during tests
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };
});

// Global test teardown
afterAll(async () => {
  // Clean up any remaining connections
  const redis = new Redis();
  await redis.quit();
  
  // Restore console
  global.console = console;
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
}); 