const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  cropId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true,
    unique: true,
    index: true
  },
  items: [cartItemSchema],
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastModified when cart is modified
cartSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Method to add item to cart
cartSchema.methods.addItem = function(cropId, quantity = 1) {
  const existingItem = this.items.find(item => item.cropId.toString() === cropId.toString());
  
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.addedAt = new Date();
  } else {
    this.items.push({ cropId, quantity });
  }
  
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(cropId, quantity) {
  const item = this.items.find(item => item.cropId.toString() === cropId.toString());
  
  if (item) {
    if (quantity <= 0) {
      this.items = this.items.filter(item => item.cropId.toString() !== cropId.toString());
    } else {
      item.quantity = quantity;
      item.addedAt = new Date();
    }
  }
  
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(cropId) {
  this.items = this.items.filter(item => item.cropId.toString() !== cropId.toString());
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// Method to get cart total items count
cartSchema.methods.getTotalItems = function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
