import mongoose from 'mongoose';

/**
 * Campaign Model
 * Stores SMS campaign information
 */

const campaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    trim: true,
    maxlength: [200, 'Campaign name cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [1600, 'Message cannot exceed 1600 characters (10 SMS segments)']
  },
  recipients: [{
    type: String
  }],
  recipientCount: {
    type: Number,
    default: 0
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'queued', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'draft'
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  sentAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  successCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  senderId: {
    type: String,
    trim: true
  },
  cost: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
campaignSchema.index({ userId: 1, createdAt: -1 });
campaignSchema.index({ userId: 1, status: 1 });

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
