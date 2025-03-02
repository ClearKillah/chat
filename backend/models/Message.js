const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true,
    ref: 'User'
  },
  receiverId: {
    type: String,
    required: true,
    ref: 'User'
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  chatId: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Create a compound index on senderId and receiverId for faster queries
messageSchema.index({ senderId: 1, receiverId: 1 });
// Create an index on chatId for faster retrieval of chat messages
messageSchema.index({ chatId: 1 });

module.exports = mongoose.model('Message', messageSchema); 