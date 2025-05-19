const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in token
 * @param {string} expiresIn - Expiration time (e.g., '1h', '7d')
 * @returns {string} JWT token
 */
function generateToken(payload, expiresIn = config.jwt.expiration) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token string
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = {
  generateToken,
  verifyToken,
};
