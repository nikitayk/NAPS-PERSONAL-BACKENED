const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const { formatResponse } = require('../utils/helpers');

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { sub: userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiration }
  );
  
  const refreshToken = jwt.sign(
    { sub: userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiration }
  );

  return { accessToken, refreshToken };
};

// User registration
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input (already handled by middleware, but good to double-check)
    if (!email || !password || !name) {
      return res.status(400).json(
        formatResponse(false, null, 'All fields are required')
      );
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(
        formatResponse(false, null, 'User already exists')
      );
    }

    // Hash password with Argon2
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456, // 19MB
      timeCost: 2,       // Iterations
      parallelism: 1     // Threads
    });

    // Create user
    const user = new User({ email, password: hashedPassword, name });
    await user.save();

    // Generate tokens
    const tokens = generateTokens(user._id);

    // Omit sensitive data from response
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    };

    res.status(201).json(
      formatResponse(true, { 
        user: userResponse,
        ...tokens 
      }, 'Registration successful')
    );

  } catch (error) {
    // Log the error for debugging (not sent to client)
    console.error('Registration error:', error);
    res.status(500).json(
      formatResponse(false, null, 'Registration failed. Please try again.')
    );
  }
};

// User login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json(
        formatResponse(false, null, 'Email and password are required')
      );
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json(
        formatResponse(false, null, 'Invalid credentials')
      );
    }

    // Verify password
    const isValid = await argon2.verify(user.password, password);
    if (!isValid) {
      return res.status(401).json(
        formatResponse(false, null, 'Invalid credentials')
      );
    }

    // Generate tokens
    const tokens = generateTokens(user._id);

    // Omit sensitive data
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    };

    res.json(
      formatResponse(true, { 
        user: userResponse,
        ...tokens 
      }, 'Login successful')
    );

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(
      formatResponse(false, null, 'Login failed. Please try again.')
    );
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json(
        formatResponse(false, null, 'Refresh token is required')
      );
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    
    // Generate new tokens
    const tokens = generateTokens(decoded.sub);

    res.json(
      formatResponse(true, tokens, 'Token refreshed successfully')
    );

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json(
      formatResponse(false, null, 'Invalid or expired refresh token')
    );
  }
};
