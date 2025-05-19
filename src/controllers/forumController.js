// src/controllers/forumController.js
const ForumPost = require('../models/ForumPost');
const ForumReply = require('../models/ForumReply');
const User = require('../models/User');

// Utility for consistent responses
const formatResponse = (success, data, message) => ({ success, data, message });

// GET /api/forums - List all forum threads
exports.listThreads = async (req, res) => {
  try {
    const threads = await ForumPost.find()
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    res.json(formatResponse(true, threads, 'Threads fetched successfully'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to fetch threads'));
  }
};

// GET /api/forums/:id - Get a single thread with replies
exports.getThread = async (req, res) => {
  try {
    const thread = await ForumPost.findById(req.params.id)
      .populate('author', 'username');
    if (!thread) return res.status(404).json(formatResponse(false, null, 'Thread not found'));

    const replies = await ForumReply.find({ thread: thread._id })
      .populate('author', 'username')
      .sort({ createdAt: 1 });

    res.json(formatResponse(true, { thread, replies }, 'Thread and replies fetched'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to fetch thread'));
  }
};

// POST /api/forums - Create a new thread
exports.createThread = async (req, res) => {
  try {
    const { title, content } = req.body;
    const author = req.user._id; // Assumes auth middleware sets req.user

    const newThread = new ForumPost({ title, content, author });
    await newThread.save();

    res.status(201).json(formatResponse(true, newThread, 'Thread created'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to create thread'));
  }
};

// POST /api/forums/:id/reply - Add a reply to a thread
exports.addReply = async (req, res) => {
  try {
    const { content } = req.body;
    const author = req.user._id;
    const thread = await ForumPost.findById(req.params.id);
    if (!thread) return res.status(404).json(formatResponse(false, null, 'Thread not found'));

    const reply = new ForumReply({ thread: thread._id, content, author });
    await reply.save();

    res.status(201).json(formatResponse(true, reply, 'Reply added'));
  } catch (error) {
    res.status(500).json(formatResponse(false, null, 'Failed to add reply'));
  }
};
