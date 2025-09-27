const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  respondedByName: {
    type: String,
    required: true
  },
  respondedAt: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['admin', 'user', 'system'],
    default: 'admin'
  },
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  }]
});

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'technical',
      'crop_disease',
      'market_price',
      'account',
      'weather',
      'equipment',
      'general',
      'other'
    ],
    index: true
  },
  cropType: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_for_user', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer'
  },
  source: {
    type: String,
    enum: ['web_form', 'email', 'phone', 'whatsapp', 'admin'],
    default: 'web_form'
  },
  tags: [{
    type: String,
    trim: true
  }],
  responses: [responseSchema],
  adminResponse: {
    type: String,
    trim: true
  },
  respondedAt: {
    type: Date
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer'
  },
  lastResponseAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5
  },
  satisfactionComment: {
    type: String,
    trim: true
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    location: String,
    deviceType: String
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isUrgent: {
    type: Boolean,
    default: function() {
      return this.priority === 'urgent';
    }
  },
  escalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: {
    type: Date
  },
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer'
  },
  internalNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ priority: 1, status: 1 });
ticketSchema.index({ category: 1, status: 1 });
ticketSchema.index({ email: 1, status: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });

// Virtual for response time calculation
ticketSchema.virtual('responseTime').get(function() {
  if (this.respondedAt && this.createdAt) {
    return Math.round((this.respondedAt - this.createdAt) / (1000 * 60 * 60)); // hours
  }
  return null;
});

// Virtual for resolution time calculation
ticketSchema.virtual('resolutionTime').get(function() {
  if (this.resolvedAt && this.createdAt) {
    return Math.round((this.resolvedAt - this.createdAt) / (1000 * 60 * 60)); // hours
  }
  return null;
});

// Virtual for time since creation
ticketSchema.virtual('age').get(function() {
  return Math.round((Date.now() - this.createdAt) / (1000 * 60 * 60)); // hours
});

// Pre-save middleware to handle status changes
ticketSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  
  // Auto-escalate urgent tickets if not responded within 2 hours
  if (this.priority === 'urgent' && this.status === 'open' && !this.escalated) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    if (this.createdAt < twoHoursAgo) {
      this.escalated = true;
      this.escalatedAt = new Date();
    }
  }
  
  next();
});

// Static method to find tickets needing escalation
ticketSchema.statics.findTicketsNeedingEscalation = function() {
  const now = new Date();
  const urgentThreshold = new Date(now - 2 * 60 * 60 * 1000); // 2 hours
  const highThreshold = new Date(now - 4 * 60 * 60 * 1000); // 4 hours
  const mediumThreshold = new Date(now - 24 * 60 * 60 * 1000); // 24 hours
  
  return this.find({
    status: { $in: ['open', 'in_progress'] },
    escalated: false,
    $or: [
      { priority: 'urgent', createdAt: { $lt: urgentThreshold } },
      { priority: 'high', createdAt: { $lt: highThreshold } },
      { priority: 'medium', createdAt: { $lt: mediumThreshold } }
    ]
  });
};

// Static method to get tickets by user
ticketSchema.statics.findByUser = function(userId, status = null) {
  const query = { userId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

// Instance method to add response
ticketSchema.methods.addResponse = function(responseData) {
  this.responses.push(responseData);
  this.lastResponseAt = new Date();
  if (responseData.type === 'admin') {
    this.respondedAt = this.respondedAt || new Date();
    this.respondedBy = this.respondedBy || responseData.respondedBy;
  }
  return this.save();
};

// Instance method to close ticket
ticketSchema.methods.close = function(reason = null) {
  this.status = 'closed';
  this.closedAt = new Date();
  if (reason) {
    this.internalNotes.push({
      note: `Ticket closed: ${reason}`,
      addedAt: new Date()
    });
  }
  return this.save();
};

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
