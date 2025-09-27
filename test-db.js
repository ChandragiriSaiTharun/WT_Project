require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Farmer = require('./server/models/Farmer');

async function testDatabase() {
  try {
    // Connect to MongoDB
    const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/kisaan_connect_db';
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB');

    // Check if any users exist
    const userCount = await Farmer.countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);

    // List all users (without passwords)
    const users = await Farmer.find({}, { password: 0 });
    console.log('👥 Users in database:', JSON.stringify(users, null, 2));

    // Test creating a user
    console.log('\n🔧 Testing user creation...');
    const testUser = {
      fullName: 'Test User DB',
      phoneNumber: '1234567890',
      email: 'testdb@example.com',
      password: await bcrypt.hash('test123', 10),
      state: 'Test State',
      district: 'Test District',
      villageTown: 'Test Village',
      pinCode: '123456'
    };

    // Check if user already exists
    const existingUser = await Farmer.findOne({ 
      $or: [{ email: testUser.email }, { phoneNumber: testUser.phoneNumber }]
    });

    if (existingUser) {
      console.log('✅ Test user already exists');
    } else {
      const newUser = new Farmer(testUser);
      const savedUser = await newUser.save();
      console.log('✅ Test user created with ID:', savedUser._id);
    }

    // Test login
    console.log('\n🔐 Testing login...');
    const loginUser = await Farmer.findOne({
      $or: [
        { email: 'testdb@example.com' },
        { phoneNumber: '1234567890' }
      ]
    });

    if (loginUser) {
      const passwordMatch = await bcrypt.compare('test123', loginUser.password);
      console.log('✅ User found for login');
      console.log('🔑 Password match:', passwordMatch);
    } else {
      console.log('❌ User not found for login');
    }

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testDatabase();
