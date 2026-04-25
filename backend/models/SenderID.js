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