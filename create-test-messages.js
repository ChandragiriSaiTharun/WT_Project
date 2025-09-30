// Test script to create sample messages for debugging
require('dotenv').config();
const mongoose = require('mongoose');
const Chat = require('./server/models/Chat');
const Message = require('./server/models/Message');
const Farmer = require('./server/models/Farmer');

async function createTestMessages() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find existing users and chats
    const farmers = await Farmer.find().limit(2);
    if (farmers.length < 2) {
      console.log('❌ Need at least 2 users for testing. Please run quick-setup.html first.');
      return;
    }

    const [user1, user2] = farmers;
    console.log('👥 Found users:', user1.fullName, 'and', user2.fullName);

    // Find or create a chat between them
    let chat = await Chat.findOne({
      participants: { $all: [user1._id, user2._id] }
    });

    if (!chat) {
      chat = new Chat({
        participants: [user1._id, user2._id]
      });
      await chat.save();
      console.log('💬 Created new chat:', chat._id);
    } else {
      console.log('💬 Using existing chat:', chat._id);
    }

    // Create test messages
    const testMessages = [
      { sender: user1._id, content: 'Hello! I\'m interested in your crops.' },
      { sender: user2._id, content: 'Hi! Which crops are you looking for?' },
      { sender: user1._id, content: 'I need some rice for my family. What\'s the price?' },
      { sender: user2._id, content: 'I have good quality rice at ₹45 per kg. Would you like to see it?' },
      { sender: user1._id, content: 'Yes, that sounds good. Can we meet tomorrow?' }
    ];

    // Clear existing messages for clean test
    await Message.deleteMany({ chatId: chat._id });
    console.log('🧹 Cleared existing messages');

    // Create new test messages
    for (const msgData of testMessages) {
      const message = new Message({
        chatId: chat._id,
        sender: msgData.sender,
        content: msgData.content,
        type: 'text'
      });
      await message.save();
    }

    console.log(`✅ Created ${testMessages.length} test messages`);

    // Update chat with last message
    const lastMessage = testMessages[testMessages.length - 1];
    await Chat.findByIdAndUpdate(chat._id, {
      $set: {
        'lastMessage.content': lastMessage.content,
        'lastMessage.sender': lastMessage.sender,
        'lastMessage.timestamp': new Date()
      }
    });

    console.log('📨 Updated chat with last message');

    // Display results
    const allMessages = await Message.find({ chatId: chat._id })
      .populate('sender', 'fullName')
      .sort({ createdAt: 1 });

    console.log('\n📋 Test Messages Created:');
    allMessages.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.sender.fullName}: ${msg.content}`);
    });

    console.log('\n🎯 Test Instructions:');
    console.log('1. Login at http://localhost:3000/Login.html');
    console.log(`2. Use phone: ${user1.phoneNumber} or ${user2.phoneNumber}, password: test123`);
    console.log('3. Go to http://localhost:3000/chats');
    console.log('4. You should see the chat with test messages!');

  } catch (error) {
    console.error('❌ Error creating test messages:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestMessages();
