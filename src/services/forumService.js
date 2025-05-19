const ForumPost = require('../models/ForumPost');
const ForumReply = require('../models/ForumReply');

/**
 * Lists all forum threads.
 */
async function listThreads() {
  return ForumPost.find()
    .populate('author', 'username')
    .sort({ createdAt: -1 });
}

/**
 * Gets a single thread and its replies.
 */
async function getThreadWithReplies(threadId) {
  const thread = await ForumPost.findById(threadId).populate('author', 'username');
  if (!thread) throw new Error('Thread not found');

  const replies = await ForumReply.find({ thread: thread._id })
    .populate('author', 'username')
    .sort({ createdAt: 1 });

  return { thread, replies };
}

/**
 * Creates a new thread.
 */
async function createThread({ title, content, author }) {
  const post = new ForumPost({ title, content, author });
  await post.save();
  return post;
}

/**
 * Adds a reply to a thread.
 */
async function addReply({ threadId, content, author }) {
  // Optionally check thread exists
  const thread = await ForumPost.findById(threadId);
  if (!thread) throw new Error('Thread not found');

  const reply = new ForumReply({ thread: threadId, content, author });
  await reply.save();
  return reply;
}

module.exports = {
  listThreads,
  getThreadWithReplies,
  createThread,
  addReply,
};
