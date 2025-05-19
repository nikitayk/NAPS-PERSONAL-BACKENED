const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

// Authentication middleware: verifies JWT and attaches user to req.user
const authenticate = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    // 2. Validate header format
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authorization header missing or invalid' 
      });
    }

    // 3. Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    // 4. Verify token (checks signature and expiration)
    const decoded = jwt.verify(token, config.jwt.secret);

    // 5. Find user in database
    const user = await User.findById(decoded.sub)
      .select('-password -__v') // Exclude sensitive fields
      .lean(); // Return plain JS object

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // 6. Attach user to request
    req.user = user;
    next();

  } catch (err) {
    // Handle specific JWT errors
    let message = 'Authentication failed';
    if (err.name === 'TokenExpiredError') {
      message = 'Token expired';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    }

    return res.status(401).json({ 
      success: false, 
      message: `Unauthorized: ${message}` 
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => (req, res, next) => {
  // 1. Check if user exists and has required role
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Forbidden: Insufficient permissions' 
    });
  }
  
  // 2. Proceed if authorized
  next();
};

module.exports = {
  authenticate,
  authorize,
};
