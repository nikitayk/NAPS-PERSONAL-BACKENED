const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

const authMiddleware = {
  // Verify JWT token
  authenticateToken: (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      jwt.verify(token, config.jwt.secret, (err, decoded) => {
        if (err) {
          if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
              status: 'error',
              message: 'Token expired',
              code: 'TOKEN_EXPIRED'
            });
          }
          return res.status(403).json({
            status: 'error',
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
          });
        }

        req.user = decoded;
        next();
      });
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Authentication failed'
      });
    }
  },

  // Optional authentication - proceed even if no token
  optionalAuth: (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        next();
        return;
      }

      jwt.verify(token, config.jwt.secret, (err, decoded) => {
        if (!err) {
          req.user = decoded;
        }
        next();
      });
    } catch (error) {
      next();
    }
  },

  // Check specific roles
  requireRole: (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        });
      }

      next();
    };
  }
};

module.exports = authMiddleware;
