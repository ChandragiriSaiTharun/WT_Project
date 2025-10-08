const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'crop-info'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

// Method to mark message as read
messageSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(read => read.userId.equals(userId))) {
    this.readBy.push({ userId });
    this.isRead = true;
  }
  return this.save();
};

// Static method to get chat messages
messageSchema.statics.getChatMessages = function(chatId, page = 1, limit = 50) {
  return this.find({ chatId })
    .populate('sender', 'fullName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

module.exports = mongoose.model('Message', messageSchema);
