import mongoose from 'mongoose';

/**
 * SMSLog Model
 * Stores individual SMS delivery logs
 */

const smsLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    default: null
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    index: true
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'queued'],
    default: 'pending',
    index: true
  },
  segments: {
    type: Number,
    default: 1
  },
  cost: {
    type: Number,
    default: 0
  },
  senderId: {
    type: String,
    trim: true
  },
  // API Response fields
  apiMessageId: {
    type: String,
    default: null
  },
  apiResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  // Timestamps
  sentAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
smsLogSchema.index({ userId: 1, createdAt: -1 });
smsLogSchema.index({ userId: 1, status: 1 });
smsLogSchema.index({ campaignId: 1 });
smsLogSchema.index({ phone: 1, createdAt: -1 });

const SMSLog = mongoose.model('SMSLog', smsLogSchema);

export default SMSLog;
