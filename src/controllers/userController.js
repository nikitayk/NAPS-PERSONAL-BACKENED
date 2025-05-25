const {
  deepClone,
  pickKeys,
  omitEmpty,
  deepMerge,
  isEmptyObject,
} = require("../utils/lodashHelpers");

const user = { name: "Alice", age: null, email: "alice@example.com" };

const cleanUser = omitEmpty(user); // { name: "Alice", email: "alice@example.com" }
const clonedUser = deepClone(user);

if (!isEmptyObject(cleanUser)) {
  // do something
}

const merged = deepMerge({ a: 1 }, { b: 2, a: 3 });
// merged = { a: 3, b: 2 }




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


const { emailQueue } = require("../queues/JobQueues");

exports.registerUser = async (req, res) => {
  try {
    // Your user registration logic here...

    // After successful registration, add email job to queue
    await emailQueue.add({
      to: req.body.email,
      subject: "Welcome to NAPS Finance!",
      body: "Thank you for signing up to NAPS Finance.",
    });

    res.status(201).json({ message: "User registered and welcome email queued." });
  } catch (error) {
    res.status(500).json({ error: "Registration failed." });
  }
};

const { generateUUID } = require("../utils/uuidHelper");

const newId = generateUUID();
console.log("Generated UUID:", newId);

// Example usage: creating a new transaction ID
const transactionId = generateUUID();
