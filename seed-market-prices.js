const mongoose = require('mongoose');

// Connect to MongoDB
const dbURI = 'mongodb+srv://thanushka:Tthanush2005@cluster-k.yzjyrci.mongodb.net/kisaan_connect_db?retryWrites=true&w=majority&appName=Cluster-k';

const marketPriceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['grains', 'vegetables', 'fruits', 'spices', 'pulses', 'oilseeds']
  },
  currentPrice: {
    type: Number,
    required: true
  },
  previousPrice: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true,
    default: 'per kg'
  },
  market: {
    type: String,
    required: true
  },
  changePercentage: {
    type: Number,
    default: 0
  },
  trend: {
    type: String,
    enum: ['up', 'down', 'stable'],
    default: 'stable'
  },
  priceHistory: [{
    price: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate trend and change percentage before saving
marketPriceSchema.pre('save', function(next) {
  if (this.currentPrice && this.previousPrice) {
    const change = ((this.currentPrice - this.previousPrice) / this.previousPrice) * 100;
    this.changePercentage = Number(change.toFixed(2));
    
    if (change > 0.5) {
      this.trend = 'up';
    } else if (change < -0.5) {
      this.trend = 'down';
    } else {
      this.trend = 'stable';
    }
  }
  next();
});

const MarketPrice = mongoose.model('MarketPrice', marketPriceSchema);

// Sample data to seed
const samplePrices = [
  {
    name: 'Rice (Basmati)',
    category: 'grains',
    currentPrice: 85,
    previousPrice: 82,
    unit: 'per kg',
    market: 'Azadpur Mandi, Delhi'
  },
  {
    name: 'Wheat',
    category: 'grains', 
    currentPrice: 28,
    previousPrice: 30,
    unit: 'per kg',
    market: 'Vashi Market, Mumbai'
  },
  {
    name: 'Tomato',
    category: 'vegetables',
    currentPrice: 45,
    previousPrice: 42,
    unit: 'per kg',
    market: 'KR Market, Bangalore'
  },
  {
    name: 'Onion',
    category: 'vegetables',
    currentPrice: 35,
    previousPrice: 38,
    unit: 'per kg',
    market: 'Azadpur Mandi, Delhi'
  },
  {
    name: 'Potato',
    category: 'vegetables',
    currentPrice: 22,
    previousPrice: 22,
    unit: 'per kg',
    market: 'Sealdah Market, Kolkata'
  },
  {
    name: 'Apple',
    category: 'fruits',
    currentPrice: 180,
    previousPrice: 175,
    unit: 'per kg',
    market: 'Azadpur Mandi, Delhi'
  },
  {
    name: 'Banana',
    category: 'fruits',
    currentPrice: 65,
    previousPrice: 65,
    unit: 'per dozen',
    market: 'Koyambedu Market, Chennai'
  },
  {
    name: 'Mango',
    category: 'fruits',
    currentPrice: 150,
    previousPrice: 135,
    unit: 'per kg',
    market: 'Begum Bazaar, Hyderabad'
  },
  {
    name: 'Turmeric',
    category: 'spices',
    currentPrice: 120,
    previousPrice: 110,
    unit: 'per kg',
    market: 'Spice Market, Chennai'
  },
  {
    name: 'Red Chili',
    category: 'spices',
    currentPrice: 85,
    previousPrice: 88,
    unit: 'per kg',
    market: 'Guntur Market, Andhra Pradesh'
  },
  {
    name: 'Toor Dal',
    category: 'pulses',
    currentPrice: 95,
    previousPrice: 92,
    unit: 'per kg',
    market: 'APMC Market, Mumbai'
  },
  {
    name: 'Groundnut',
    category: 'oilseeds',
    currentPrice: 75,
    previousPrice: 78,
    unit: 'per kg',
    market: 'Rajkot Market, Gujarat'
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbURI);
    console.log('Connected to MongoDB');
    
    // Clear existing data
    console.log('Clearing existing market price data...');
    await MarketPrice.deleteMany({});
    
    // Insert sample data
    console.log('Inserting sample market prices...');
    await MarketPrice.insertMany(samplePrices);
    
    console.log('✅ Database seeded successfully with', samplePrices.length, 'market prices');
    
    // Verify insertion
    const count = await MarketPrice.countDocuments();
    console.log('Total market prices in database:', count);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();
