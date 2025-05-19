const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');
const { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema 
} = require('../validators/userSchemas'); // Ensure this schema exists

// User Registration
router.post(
  '/register',
  validateRequest(registerSchema),
  authController.register
);

// User Login
router.post(
  '/login',
  validateRequest(loginSchema),
  authController.login
);

// Token Refresh (added validation)
router.post(
  '/refresh',
  validateRequest(refreshTokenSchema), // Validate refresh token presence/format
  authController.refreshToken
);

module.exports = router;
