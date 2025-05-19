const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Registers a new user with hashed password
 * @param {Object} userData - User data including name, email, password
 * @returns {Object} Created user
 */
async function register(userData) {
  const { name, email, password } = userData;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = new User({ name, email, password: hashedPassword });
  await user.save();
  return user;
}

/**
 * Finds a user by email
 * @param {String} email
 * @returns {Object|null} User or null
 */
async function findByEmail(email) {
  return User.findOne({ email });
}

/**
 * Finds a user by ID
 * @param {String} userId
 * @returns {Object|null} User or null
 */
async function findById(userId) {
  return User.findById(userId).select('-password');
}

/**
 * Updates user profile
 * @param {String} userId
 * @param {Object} updates
 * @returns {Object} Updated user
 */
async function updateProfile(userId, updates) {
  // Prevent password update here; use separate method
  delete updates.password;
  delete updates.email; // Optional: prevent email change

  const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select('-password');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

/**
 * Deletes a user by ID
 * @param {String} userId
 */
async function deleteUser(userId) {
  await User.findByIdAndDelete(userId);
}

module.exports = {
  register,
  findByEmail,
  findById,
  updateProfile,
  deleteUser,
};
