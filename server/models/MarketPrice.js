const mongoose = require('mongoose');

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
    required: true,
    default: 'Delhi Mandi'
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
  },
  trend: {
    type: String,
    enum: ['up', 'down', 'stable'],
    default: 'stable'
  },
  changePercentage: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate trend and change percentage before saving
marketPriceSchema.pre('save', function(next) {
  if (this.currentPrice > this.previousPrice) {
    this.trend = 'up';
    this.changePercentage = ((this.currentPrice - this.previousPrice) / this.previousPrice * 100).toFixed(2);
  } else if (this.currentPrice < this.previousPrice) {
    this.trend = 'down';
    this.changePercentage = ((this.previousPrice - this.currentPrice) / this.previousPrice * 100).toFixed(2);
  } else {
    this.trend = 'stable';
    this.changePercentage = 0;
  }
  this.lastUpdated = new Date();
  next();
});

const MarketPrice = mongoose.model('MarketPrice', marketPriceSchema);

module.exports = MarketPrice;
