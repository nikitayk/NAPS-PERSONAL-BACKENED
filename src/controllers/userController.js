const User = require('../models/User');
const { formatResponse } = require('../utils/helpers');

// GET /api/users/me - Get current user's profile
exports.getProfile = async (req, res, next) => {
  try {
    // Exclude sensitive fields like password
    const user = await User.findById(req.user._id).select('-password -__v');
    if (!user) {
      return res.status(404).json(formatResponse(false, null, 'User not found'));
    }
    res.json(formatResponse(true, user, 'User profile fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/me - Update current user's profile
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    // Prevent sensitive fields from being updated
    delete updates.password;
    delete updates.email; // If you want to prevent email change

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password -__v');
    if (!user) {
      return res.status(404).json(formatResponse(false, null, 'User not found'));
    }
    res.json(formatResponse(true, user, 'User profile updated successfully'));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/me - Delete current user's account
exports.deleteProfile = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.user._id);
    if (!user) {
      return res.status(404).json(formatResponse(false, null, 'User not found'));
    }
    res.json(formatResponse(true, null, 'User deleted successfully'));
  } catch (err) {
    next(err);
  }
};

// GET /api/users - List all users (admin only)
exports.listUsers = async (req, res, next) => {
  try {
    // You should check for admin privileges in middleware before this controller
    const users = await User.find().select('-password -__v');
    res.json(formatResponse(true, users, 'User list fetched successfully'));
  } catch (err) {
    next(err);
  }
};
