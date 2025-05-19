// src/models/Lesson.js

const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 128,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1024,
  },
  content: {
    type: String,
    trim: true,
    maxlength: 5000,
    default: '',
  },
  order: {
    type: Number,
    default: 0,
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 32,
  }],
  // Add more fields as needed, e.g., videoUrl, resources, etc.
}, {
  timestamps: true,
});

module.exports = mongoose.model('Lesson', LessonSchema);
