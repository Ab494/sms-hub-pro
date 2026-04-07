import mongoose from 'mongoose';

/**
 * SenderID Model
 * Tracks available sender IDs and their ownership
 */

const senderIdSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: [true, 'Sender ID is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Sender ID must be at least 3 characters'],
    maxlength: [11, 'Sender ID cannot exceed 11 characters']
  },
  name: {
    type: String,
    required: [true, 'Sender ID name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means available for purchase
  },
  isRegistered: {
    type: Boolean,
    default: false // Whether registered with SMS provider
  },
  isActive: {
    type: Boolean,
    default: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    enum: ['generic', 'premium', 'custom'],
    default: 'generic'
  },
  purchaseDate: {
    type: Date,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
senderIdSchema.index({ senderId: 1 });
senderIdSchema.index({ ownerId: 1 });
senderIdSchema.index({ isActive: 1 });
senderIdSchema.index({ category: 1 });

// Virtual for checking if expired
senderIdSchema.virtual('isExpired').get(function() {
  return this.expiryDate && new Date() > this.expiryDate;
});

// Virtual for checking if owned
senderIdSchema.virtual('isOwned').get(function() {
  return !!this.ownerId;
});

// Static method to get available sender IDs
senderIdSchema.statics.getAvailable = function(category = null) {
  const query = {
    ownerId: null,
    isActive: true,
    isRegistered: true
  };

  if (category) {
    query.category = category;
  }

  return this.find(query).sort({ price: 1 });
};

// Static method to initialize default sender IDs
senderIdSchema.statics.initializeDefaults = async function() {
  const defaults = [
    // Generic sender IDs (free/low cost)
    { senderId: 'INFO', name: 'Information', description: 'General information sender', price: 0, category: 'generic', isRegistered: true },
    { senderId: 'ALERT', name: 'Alerts', description: 'Alert notifications', price: 500, category: 'generic', isRegistered: true },
    { senderId: 'NEWS', name: 'News', description: 'News updates', price: 500, category: 'generic', isRegistered: true },
    { senderId: 'UPDATE', name: 'Updates', description: 'Status updates', price: 500, category: 'generic', isRegistered: true },

    // Premium sender IDs (higher cost)
    { senderId: 'PROMO', name: 'Promotions', description: 'Promotional messages', price: 2000, category: 'premium', isRegistered: true },
    { senderId: 'OFFER', name: 'Offers', description: 'Special offers', price: 2000, category: 'premium', isRegistered: true },
    { senderId: 'DEAL', name: 'Deals', description: 'Great deals', price: 2000, category: 'premium', isRegistered: true },

    // Custom sender IDs (most expensive - available for purchase)
    { senderId: 'CUSTOM1', name: 'Custom Sender 1', description: 'Available for custom branding', price: 5000, category: 'custom', isRegistered: false },
    { senderId: 'CUSTOM2', name: 'Custom Sender 2', description: 'Available for custom branding', price: 5000, category: 'custom', isRegistered: false },
    { senderId: 'CUSTOM3', name: 'Custom Sender 3', description: 'Available for custom branding', price: 5000, category: 'custom', isRegistered: false }
  ];

  for (const senderIdData of defaults) {
    await this.findOneAndUpdate(
      { senderId: senderIdData.senderId },
      senderIdData,
      { upsert: true, new: true }
    );
  }
};

// Method to purchase sender ID
senderIdSchema.methods.purchase = async function(userId, durationMonths = 12) {
  if (this.ownerId) {
    throw new Error('Sender ID is already owned');
  }

  this.ownerId = userId;
  this.purchaseDate = new Date();

  // Set expiry date (default 1 year)
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
  this.expiryDate = expiryDate;

  await this.save();
  return this;
};

// Method to release sender ID (when expired or cancelled)
senderIdSchema.methods.release = async function() {
  this.ownerId = null;
  this.purchaseDate = null;
  this.expiryDate = null;
  await this.save();
  return this;
};

const SenderID = mongoose.model('SenderID', senderIdSchema);

export default SenderID;