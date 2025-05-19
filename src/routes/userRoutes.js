const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Get current user's profile
router.get('/me', authenticate, userController.getProfile);

// Update current user's profile
router.put('/me', authenticate, userController.updateProfile);

// Delete current user's account
router.delete('/me', authenticate, userController.deleteProfile);

// List all users (admin only)
router.get('/', authenticate, authorize('admin'), userController.listUsers);

module.exports = router;
