const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Registers a new user.
 */
async function register({ name, email, password }) {
  // Check if user exists
  const existing = await User.findOne({ email });
  if (existing) throw new Error('User already exists');

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = new User({ name, email, password: hashedPassword });
  await user.save();
  return user;
}

/**
 * Authenticates user and returns JWT token.
 */
async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  // Generate JWT
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiration }
  );

  return { user, token };
}

/**
 * Generates a new JWT refresh token.
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiration }
  );
}

module.exports = {
  register,
  login,
  generateRefreshToken,
};
