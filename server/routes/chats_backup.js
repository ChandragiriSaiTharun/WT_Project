const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Farmer = require('../models/Farmer');
const Crop = require('../models/Crop');

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Debug endpoint to check database data
router.get('/debug', async (req, res) => {
  try {
    const farmers = await Farmer.find().select('fullName email').limit(5);
    const crops = await Crop.find().select('name seller sellerId').limit(5);
    const chats = await Chat.find().limit(5);
    
    res.json({
      farmersCount: await Farmer.countDocuments(),
      cropsCount: await Crop.countDocuments(),
      chatsCount: await Chat.countDocuments(),
      sampleFarmers: farmers,
      sampleCrops: crops,
      sampleChats: chats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /chats - Get all chats for the current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const chats = await Chat.getUserChats(req.session.userId);
    
    // Format chats for frontend
    const formattedChats = chats.map(chat => {
      const otherParticipant = chat.participants.find(p => !p._id.equals(req.session.userId));
      const unreadCount = chat.unreadCount.find(u => u.userId.equals(req.session.userId))?.count || 0;
  next();
};

// Get user's chats
router.get('/', requireAuth, async (req, res) => {
  try {
    const chats = await Chat.getUserChats(req.session.userId);
    
    // Format chats for frontend
    const formattedChats = chats.map(chat => {
      const otherParticipant = chat.participants.find(p => !p._id.equals(req.session.userId));
      const unreadCount = chat.unreadCount.find(u => u.userId.equals(req.session.userId))?.count || 0;
      
      return {
        chatId: chat._id,
        participant: {
          id: otherParticipant._id,
          name: otherParticipant.fullName,
          profilePicture: otherParticipant.profilePicture
        },
        crop: chat.cropId ? {
          id: chat.cropId._id,
          name: chat.cropId.name,
          imageUrl: chat.cropId.imageUrl
        } : null,
        lastMessage: {
          content: chat.lastMessage.content,
          timestamp: chat.lastMessage.timestamp,
          isOwn: chat.lastMessage.sender ? chat.lastMessage.sender.equals(req.session.userId) : false
        },
        unreadCount,
        updatedAt: chat.updatedAt
      };
    });

    res.json({ success: true, chats: formattedChats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Start or get existing chat
router.post('/start', requireAuth, async (req, res) => {
  try {
    const { participantId, cropId } = req.body;
    console.log('🔥 Chat start request:', { 
      userId: req.session.userId, 
      participantId, 
      cropId,
      body: req.body 
    });
    
    if (!participantId) {
      console.log('❌ Missing participant ID');
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    if (participantId === req.session.userId) {
      console.log('❌ User trying to chat with themselves');
      return res.status(400).json({ error: 'Cannot start chat with yourself' });
    }

    // Check if participant exists
    const participant = await Farmer.findById(participantId);
    console.log('👤 Participant lookup:', participant ? 'Found' : 'Not found');
    if (!participant) {
      console.log('❌ Participant not found:', participantId);
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Check if chat already exists
    let chat = await Chat.findChatBetweenUsers(req.session.userId, participantId, cropId);
    
    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [req.session.userId, participantId],
        cropId: cropId || undefined
      });
      await chat.save();
      await chat.populate('participants', 'fullName profilePicture');
      if (cropId) {
        await chat.populate('cropId', 'name imageUrl');
      }
    }

    const otherParticipant = chat.participants.find(p => !p._id.equals(req.session.userId));
    
    res.json({
      success: true,
      chat: {
        chatId: chat._id,
        participant: {
          id: otherParticipant._id,
          name: otherParticipant.fullName,
          profilePicture: otherParticipant.profilePicture
        },
        crop: chat.cropId ? {
          id: chat.cropId._id,
          name: chat.cropId.name,
          imageUrl: chat.cropId.imageUrl
        } : null
      }
    });
  } catch (error) {
    console.error('Error starting chat:', error);
    res.status(500).json({ error: 'Failed to start chat' });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.session.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.getChatMessages(chatId, parseInt(page), parseInt(limit));
    
    // Mark messages as read
    await Message.updateMany(
      { chatId, sender: { $ne: req.session.userId }, isRead: false },
      { $set: { isRead: true }, $push: { readBy: { userId: req.session.userId } } }
    );

    // Update unread count
    await Chat.findByIdAndUpdate(chatId, {
      $set: {
        'unreadCount.$[elem].count': 0
      }
    }, {
      arrayFilters: [{ 'elem.userId': req.session.userId }]
    });

    const formattedMessages = messages.reverse().map(message => ({
      messageId: message._id,
      content: message.content,
      sender: {
        id: message.sender._id,
        name: message.sender.fullName,
        profilePicture: message.sender.profilePicture
      },
      messageType: message.messageType,
      fileUrl: message.fileUrl,
      isOwn: message.sender._id.equals(req.session.userId),
      isRead: message.isRead,
      isEdited: message.isEdited,
      timestamp: message.createdAt
    }));

    res.json({ success: true, messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/:chatId/messages', requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, messageType = 'text' } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.session.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create message
    const message = new Message({
      chatId,
      sender: req.session.userId,
      content: content.trim(),
      messageType
    });

    await message.save();
    await message.populate('sender', 'fullName profilePicture');

    // Update chat's last message and unread counts
    const otherParticipantId = chat.participants.find(id => !id.equals(req.session.userId));
    
    await Chat.findByIdAndUpdate(chatId, {
      $set: {
        'lastMessage.content': content.trim(),
        'lastMessage.sender': req.session.userId,
        'lastMessage.timestamp': new Date()
      },
      $inc: {
        'unreadCount.$[elem].count': 1
      }
    }, {
      arrayFilters: [{ 'elem.userId': otherParticipantId }],
      upsert: false
    });

    // If unread count doesn't exist for other participant, create it
    await Chat.findByIdAndUpdate(chatId, {
      $addToSet: {
        unreadCount: { userId: otherParticipantId, count: 1 }
      }
    });

    const formattedMessage = {
      messageId: message._id,
      content: message.content,
      sender: {
        id: message.sender._id,
        name: message.sender.fullName,
        profilePicture: message.sender.profilePicture
      },
      messageType: message.messageType,
      isOwn: true,
      isRead: false,
      timestamp: message.createdAt
    };

    res.json({ success: true, message: formattedMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Delete chat
router.delete('/:chatId', requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.session.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Soft delete - just mark as inactive for this user
    await Chat.findByIdAndUpdate(chatId, {
      $set: { isActive: false }
    });

    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

module.exports = router;
