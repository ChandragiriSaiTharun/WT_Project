// Migration script to add sellerId to existing crops
require('dotenv').config();
const mongoose = require('mongoose');
const Crop = require('./server/models/Crop');
const Farmer = require('./server/models/Farmer');

// Connect to MongoDB using the same logic as app.js
const connectDB = async () => {
  try {
    const connectionString = process.env.MONGODB_URI || `mongodb://${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '27017'}/${process.env.DB_NAME || 'kisaanconnect'}`;
    
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string:', connectionString.replace(/\/\/[^@]*@/, '//***:***@')); // Hide credentials in log
    
    await mongoose.connect(connectionString);
    console.log('✅ Successfully connected to MongoDB');
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
};

async function migrateCrops() {
  console.log('🚀 Starting crop migration...');
  await connectDB();
  console.log('✅ Connected to database');
  
  try {
    // Get all crops that don't have sellerId
    const cropsWithoutSellerId = await Crop.find({ 
      $or: [
        { sellerId: { $exists: false } },
        { sellerId: null }
      ]
    });

    console.log(`Found ${cropsWithoutSellerId.length} crops without sellerId`);

    if (cropsWithoutSellerId.length === 0) {
      console.log('All crops already have sellerId');
      process.exit(0);
    }

    // Get the first farmer to use as default seller
    const firstFarmer = await Farmer.findOne();
    
    if (!firstFarmer) {
      console.log('No farmers found in database. Please create a farmer first.');
      process.exit(1);
    }

    console.log(`Using farmer ${firstFarmer.fullName} (${firstFarmer._id}) as default seller for existing crops`);

    // Update all crops without sellerId
    const result = await Crop.updateMany(
      { 
        $or: [
          { sellerId: { $exists: false } },
          { sellerId: null }
        ]
      },
      { 
        $set: { sellerId: firstFarmer._id }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} crops with sellerId`);
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

migrateCrops();
