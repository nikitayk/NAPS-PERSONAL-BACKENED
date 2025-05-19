const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { authenticate } = require('../middlewares/authMiddleware');

// List all forum threads
router.get('/', forumController.listThreads);

// Get a single thread with replies
router.get('/:id', forumController.getThread);

// Create a new thread (authenticated)
router.post('/', authenticate, forumController.createThread);

// Add a reply to a thread (authenticated)
router.post('/:id/reply', authenticate, forumController.addReply);

module.exports = router;
