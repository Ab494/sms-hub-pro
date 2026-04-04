import mongoose from 'mongoose';

/**
 * Withdrawal Model
 * Tracks profit withdrawals by admin
 */

const withdrawalSchema = new mongoose.Schema({
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required'],
    validate: {
      validator: async function(userId) {
        const user = await mongoose.model('User').findById(userId);
        return user && user.role === 'admin';
      },
      message: 'Only admins can request withdrawals'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [100, 'Minimum withdrawal is KES 100']
  },
  method: {
    type: String,
    enum: ['mpesa', 'bank_transfer'],
    required: [true, 'Payment method is required']
  },
  recipientDetails: {
    phone: {
      type: String,
      required: function() { return this.method === 'mpesa'; }
    },
    accountName: {
      type: String,
      required: function() { return this.method === 'bank_transfer'; }
    },
    accountNumber: {
      type: String,
      required: function() { return this.method === 'bank_transfer'; }
    },
    bankName: {
      type: String,
      required: function() { return this.method === 'bank_transfer'; }
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  reference: {
    type: String,
    unique: true,
    sparse: true
  },
  notes: {
    type: String,
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
withdrawalSchema.index({ requestedBy: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ reference: 1 });

// Virtual for formatted amount
withdrawalSchema.virtual('formattedAmount').get(function() {
  return `KES ${this.amount.toLocaleString()}`;
});

// Method to mark as completed
withdrawalSchema.methods.complete = function(processorId, reference = null) {
  this.status = 'completed';
  this.processedAt = new Date();
  this.processedBy = processorId;
  if (reference) this.reference = reference;
  return this.save();
};

// Method to mark as failed
withdrawalSchema.methods.fail = function(processorId, notes = null) {
  this.status = 'failed';
  this.processedAt = new Date();
  this.processedBy = processorId;
  if (notes) this.notes = notes;
  return this.save();
};

// Static method to get total withdrawn
withdrawalSchema.statics.getTotalWithdrawn = function() {
  return this.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
};

// Pre-save middleware to generate reference
withdrawalSchema.pre('save', function(next) {
  if (!this.reference && this.status !== 'pending') {
    this.reference = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

export default Withdrawal;