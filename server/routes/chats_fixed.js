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

// GET /chats - Get all chats for the current user
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
      console.log('💬 Creating new chat');
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
    } else {
      console.log('💬 Using existing chat');
    }

    const otherParticipant = chat.participants.find(p => !p._id.equals(req.session.userId));
    
    console.log('✅ Chat ready:', chat._id);
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
    console.error('❌ Error starting chat:', error);
    res.status(500).json({ error: 'Failed to start chat' });
  }
});

// GET /chats/:chatId/messages - Get messages for a specific chat
router.get('/:chatId/messages', requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.session.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.getChatMessages(chatId, parseInt(page), parseInt(limit));
    
    // Mark messages as read for current user
    await Message.markMessagesAsRead(chatId, req.session.userId);

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /chats/:chatId/messages - Send a message
router.post('/:chatId/messages', requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text' } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify user is part of this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.session.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create message
    const message = new Message({
      chatId,
      sender: req.session.userId,
      content: content.trim(),
      type
    });

    await message.save();
    await message.populate('sender', 'fullName profilePicture');

    // Update chat's last message and unread counts
    chat.lastMessage = {
      content: message.content,
      timestamp: message.createdAt,
      sender: message.sender._id
    };

    // Update unread counts for other participants
    const otherParticipants = chat.participants.filter(p => !p.equals(req.session.userId));
    for (const participantId of otherParticipants) {
      const unreadEntry = chat.unreadCount.find(u => u.userId.equals(participantId));
      if (unreadEntry) {
        unreadEntry.count += 1;
      } else {
        chat.unreadCount.push({ userId: participantId, count: 1 });
      }
    }

    await chat.save();

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

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

module.exports = router;
