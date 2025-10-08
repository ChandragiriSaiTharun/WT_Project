const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true,
    index: true
  },
  items: [{
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastModified on save
wishlistSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Instance method to get total items
wishlistSchema.methods.getTotalItems = function() {
  return this.items.length;
};

// Instance method to add item
wishlistSchema.methods.addItem = function(cropId) {
  const existingItem = this.items.find(item => 
    item.cropId.toString() === cropId.toString()
  );
  
  if (!existingItem) {
    this.items.push({ cropId });
  }
  
  return this.save();
};

// Instance method to remove item
wishlistSchema.methods.removeItem = function(cropId) {
  this.items = this.items.filter(item => 
    item.cropId.toString() !== cropId.toString()
  );
  
  return this.save();
};

// Instance method to clear wishlist
wishlistSchema.methods.clearWishlist = function() {
  this.items = [];
  return this.save();
};

module.exports = mongoose.model('Wishlist', wishlistSchema);
