const Lesson = require('../models/lesson');
const User = require('../models/User');
const mongoose = require('mongoose');

// GET /lessons - List all lessons with user's completion status
exports.getLessons = async (req, res) => {
  try {
    // Fetch all lessons
    const lessons = await Lesson.find().sort({ order: 1, createdAt: 1 });

    // Get user's completed lessons (if logged in)
    let completedLessons = [];
    if (req.user) {
      completedLessons = req.user.completedLessons.map(id => id.toString());
    }

    // Attach completed status to each lesson
    const lessonsWithStatus = lessons.map(lesson => ({
      id: lesson._id,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      order: lesson.order,
      tags: lesson.tags,
      completed: completedLessons.includes(lesson._id.toString()),
    }));

    res.json({
      success: true,
      data: lessonsWithStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lessons',
    });
  }
};

// POST /lessons/:id/complete - Mark a lesson as complete for the user
exports.completeLesson = async (req, res) => {
  try {
    const lessonId = req.params.id;
    const userId = req.user._id;

    // Validate lessonId
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
    }

    // Check if lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    // Update user's completedLessons if not already marked
    const user = await User.findById(userId);
    if (!user.completedLessons.map(id => id.toString()).includes(lessonId)) {
      user.completedLessons.push(lessonId);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Lesson marked as complete',
      lessonId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark lesson as complete',
    });
  }
};
