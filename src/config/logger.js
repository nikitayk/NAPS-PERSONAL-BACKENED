const { createLogger, format, transports } = require('winston');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    // Console output (colorized in development)
    new transports.Console({
      format: isProduction
        ? format.json()
        : format.combine(
            format.colorize(),
            format.printf(({ level, message, timestamp, stack }) => {
              return `[${timestamp}] ${level}: ${stack || message}`;
            })
          ),
    }),
    // File output for errors
    new transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File output for all logs
    new transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

// Stream for morgan HTTP request logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
