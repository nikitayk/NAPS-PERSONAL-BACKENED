const mongoose = require('mongoose');
const { Schema } = mongoose;

const forumReplySchema = new Schema({
  thread: { type: Schema.Types.ObjectId, ref: 'ForumPost', required: true },
  parentReply: { type: Schema.Types.ObjectId, ref: 'ForumReply', default: null }, // For nested replies
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('ForumReply', forumReplySchema);
