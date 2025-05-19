const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { authenticate } = require('../middlewares/authMiddleware');

// GET /lessons - List all lessons with completion status (requires auth)
router.get('/', authenticate, lessonController.getLessons);

// POST /lessons/:id/complete - Mark lesson as complete (requires auth)
router.post('/:id/complete', authenticate, lessonController.completeLesson);

module.exports = router;
