require('dotenv').config();
const mongoose = require('mongoose');
const MarketPrice = require('./server/models/MarketPrice');

async function testMarketPrices() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://thanushpawan2005:Thanush%40123@cluster-k.yzjyrci.mongodb.net/kisaan_connect_db?retryWrites=true&w=majority&appName=Cluster-k');
    console.log('✅ Connected to MongoDB');

    // Check existing market prices
    const existingPrices = await MarketPrice.find();
    console.log(`📊 Found ${existingPrices.length} existing market prices`);

    if (existingPrices.length === 0) {
      console.log('🌱 Seeding database with market price data...');
      
      // Clear existing data
      await MarketPrice.deleteMany({});

      const seedData = [
        // Grains
        { name: 'Rice (Basmati)', category: 'grains', currentPrice: 85, previousPrice: 82, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Wheat', category: 'grains', currentPrice: 25, previousPrice: 26, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Corn', category: 'grains', currentPrice: 22, previousPrice: 21, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Barley', category: 'grains', currentPrice: 28, previousPrice: 29, unit: 'per kg', market: 'Delhi Mandi' },
        
        // Vegetables
        { name: 'Tomato', category: 'vegetables', currentPrice: 45, previousPrice: 38, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Onion', category: 'vegetables', currentPrice: 35, previousPrice: 42, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Potato', category: 'vegetables', currentPrice: 18, previousPrice: 20, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Carrot', category: 'vegetables', currentPrice: 25, previousPrice: 23, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Cabbage', category: 'vegetables', currentPrice: 15, previousPrice: 16, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Cauliflower', category: 'vegetables', currentPrice: 30, previousPrice: 28, unit: 'per kg', market: 'Delhi Mandi' },
        
        // Fruits
        { name: 'Apple', category: 'fruits', currentPrice: 120, previousPrice: 115, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Banana', category: 'fruits', currentPrice: 40, previousPrice: 38, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Orange', category: 'fruits', currentPrice: 60, previousPrice: 65, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Mango', category: 'fruits', currentPrice: 80, previousPrice: 75, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Grapes', category: 'fruits', currentPrice: 90, previousPrice: 85, unit: 'per kg', market: 'Delhi Mandi' },
        
        // Pulses
        { name: 'Lentils (Red)', category: 'pulses', currentPrice: 95, previousPrice: 92, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Chickpeas', category: 'pulses', currentPrice: 75, previousPrice: 78, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Black Gram', category: 'pulses', currentPrice: 105, previousPrice: 102, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Green Gram', category: 'pulses', currentPrice: 85, previousPrice: 88, unit: 'per kg', market: 'Delhi Mandi' },
        
        // Spices
        { name: 'Turmeric', category: 'spices', currentPrice: 180, previousPrice: 175, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Cumin', category: 'spices', currentPrice: 420, previousPrice: 410, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Coriander', category: 'spices', currentPrice: 150, previousPrice: 145, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Red Chili', category: 'spices', currentPrice: 220, previousPrice: 215, unit: 'per kg', market: 'Delhi Mandi' },
        
        // Oilseeds
        { name: 'Groundnut', category: 'oilseeds', currentPrice: 65, previousPrice: 68, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Sunflower', category: 'oilseeds', currentPrice: 55, previousPrice: 52, unit: 'per kg', market: 'Delhi Mandi' },
        { name: 'Mustard', category: 'oilseeds', currentPrice: 48, previousPrice: 50, unit: 'per kg', market: 'Delhi Mandi' }
      ];

      await MarketPrice.insertMany(seedData);
      console.log(`✅ Successfully seeded ${seedData.length} market prices`);
    } else {
      console.log('📋 Market prices already exist:');
      existingPrices.slice(0, 5).forEach(price => {
        console.log(`  - ${price.name}: ₹${price.currentPrice}/${price.unit}`);
      });
      if (existingPrices.length > 5) {
        console.log(`  ... and ${existingPrices.length - 5} more items`);
      }
    }

    // Test API response format
    console.log('\n🔍 Testing API response format...');
    const apiData = await MarketPrice.find().sort({ name: 1 });
    console.log('API Response:', JSON.stringify({
      success: true,
      data: apiData.slice(0, 2), // Show first 2 items
      count: apiData.length
    }, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testMarketPrices();
