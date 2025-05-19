// server.js

// Only load .env for local development, not in production (Railway injects env vars)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Import the Express app (all middleware, routes, and configs are set up in app.js)
const app = require('./src/app');

// Always use the port provided by Railway (or fallback to 5000 locally)
const PORT = process.env.PORT || 5000;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown on unhandled errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Optional: Catch uncaught exceptions too (for extra safety)
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
