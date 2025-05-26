const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const config = require('../config/config');

let store;

if (process.env.NODE_ENV === 'production' && config.redis.host) {
  const redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
  });

  store = new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  });
}

const limiter = rateLimit({
  store: store,
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for certain trusted sources if needed
    return false;
  },
});

module.exports = limiter;
