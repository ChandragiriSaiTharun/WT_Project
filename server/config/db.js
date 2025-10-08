const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connectionString = process.env.MONGODB_URI || `mongodb://${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '27017'}/${process.env.DB_NAME || 'kisaanconnect'}`;
    
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string:', connectionString.replace(/\/\/[^@]*@/, '//***:***@')); // Hide credentials in log
    
    await mongoose.connect(connectionString);
    
    console.log('✅ Successfully connected to MongoDB');
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err.message);
    console.log('\n🔧 SETUP INSTRUCTIONS:');
    console.log('1. Make sure MongoDB is installed and running');
    console.log('2. For local installation:');
    console.log('   - Ubuntu/Debian: sudo apt-get install mongodb');
    console.log('   - macOS: brew install mongodb-community');
    console.log('   - Start service: sudo systemctl start mongodb');
    console.log('3. Or update MONGODB_URI in .env to point to your MongoDB instance');
    
    const safeConnectionString = (process.env.MONGODB_URI || `mongodb://${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '27017'}/${process.env.DB_NAME || 'kisaanconnect'}`).replace(/\/\/[^@]*@/, '//***:***@');
    console.log('4. Current connection attempt: ' + safeConnectionString);
    console.log('\nServer will exit now. Please fix MongoDB connection and restart.\n');
    process.exit(1);
  }
};

module.exports = connectDB;