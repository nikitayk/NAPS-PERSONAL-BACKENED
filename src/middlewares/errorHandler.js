const config = require('../config/config');

// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log error
  config.logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Determine error type and format response
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';
  let details = undefined;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    errorCode = 'VALIDATION_ERROR';
    details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  } else if (err.name === 'MongoError' && err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
    errorCode = 'DUPLICATE_ERROR';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Send response
  res.status(statusCode).json({
    status: 'error',
    message,
    code: errorCode,
    ...(details && { details }),
    ...(config.env === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
