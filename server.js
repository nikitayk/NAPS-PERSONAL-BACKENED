// Load environment variables from .env file
require('dotenv').config();

// Import the Express app (all middleware, routes, and configs are set up in app.js)
const app = require('./src/app');
const config = require('./src/config/config');

// Set port from config, environment, or default to 5000
const PORT = config.port || process.env.PORT || 5000;

// Start the server
const server = app.listen(PORT, () => {
  if (config.logger && typeof config.logger.info === 'function') {
    config.logger.info(`Server running on port ${PORT}`);
  } else {
    console.log(`Server running on port ${PORT}`);
  }
});

// Graceful shutdown on unhandled errors
process.on('unhandledRejection', (err) => {
  if (config.logger && typeof config.logger.error === 'function') {
    config.logger.error('Unhandled Rejection:', err);
  } else {
    console.error('Unhandled Rejection:', err);
  }
  server.close(() => process.exit(1));
});
