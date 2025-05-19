const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    // Connect to MongoDB using the URI from config (no deprecated options)
    await mongoose.connect(config.database.uri);

    // Success log
    config.logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    // Log error and exit process
    config.logger.error('MongoDB connection error:', error);
    process.exit(1);
  }

  // Handle connection events
  mongoose.connection.on('disconnected', () => {
    config.logger.warn('MongoDB disconnected. Attempting to reconnect...');
    connectDB();
  });

  mongoose.connection.on('error', (err) => {
    config.logger.error('MongoDB connection error:', err);
  });
};

module.exports = connectDB;

