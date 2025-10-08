const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  seller: {
    type: String,
    required: true,
    trim: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  addedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Index for faster queries
cropSchema.index({ name: 1 });
cropSchema.index({ seller: 1 });
cropSchema.index({ location: 1 });
cropSchema.index({ addedDate: -1 }); // For sorting by newest first

const Crop = mongoose.model('Crop', cropSchema);

module.exports = Crop;
