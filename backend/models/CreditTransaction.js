import mongoose from 'mongoose';

/**
 * CreditTransaction Model
 * Tracks all credit purchases and usage for companies
 */

const creditTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['purchase', 'usage', 'refund', 'bonus', 'adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  cost: {
    type: Number,
    default: 0 // Cost in KES (what you pay to BlessedTexts)
  },
  price: {
    type: Number,
    default: 0 // Price in KES (what you charge the company)
  },
  previousBalance: {
    type: Number,
    required: true
  },
  newBalance: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  reference: {
    type: String,
    default: null // For payment references, campaign IDs, etc.
  },
  // If this is usage from a campaign/sms
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    default: null
  },
  // For admin manual adjustments
  adjustedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed', 'cancelled'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Index for faster queries
creditTransactionSchema.index({ userId: 1, createdAt: -1 });
creditTransactionSchema.index({ type: 1 });

// Virtual for profit (price - cost)
creditTransactionSchema.virtual('profit').get(function() {
  return this.price - this.cost;
});

// Method to get transaction summary
creditTransactionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    type: this.type,
    amount: this.amount,
    previousBalance: this.previousBalance,
    newBalance: this.newBalance,
    description: this.description,
    createdAt: this.createdAt
  };
};

const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);

export default CreditTransaction;