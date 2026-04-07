import mongoose from 'mongoose';

const senderIdRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestedSenderId: {
    type: String,
    required: [true, 'Sender ID is required'],
    uppercase: true,
    trim: true,
    minlength: [3, 'Sender ID must be at least 3 characters'],
    maxlength: [11, 'Sender ID cannot exceed 11 characters'],
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminNotes: {
    type: String,
    trim: true,
    default: null,
  },
  price: {
    type: Number,
    default: 5000,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

senderIdRequestSchema.index({ userId: 1 });
senderIdRequestSchema.index({ status: 1 });

const SenderIDRequest = mongoose.model('SenderIDRequest', senderIdRequestSchema);

export default SenderIDRequest;
