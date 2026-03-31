import mongoose from 'mongoose';

/**
 * Group Model
 * Stores contact groups for users
 */

const groupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: null
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for user group queries
groupSchema.index({ userId: 1, name: 1 }, { unique: true });

/**
 * Virtual for contact count in this group
 */
groupSchema.virtual('contactCount', {
  ref: 'Contact',
  localField: '_id',
  foreignField: 'groupId',
  count: true
});

const Group = mongoose.model('Group', groupSchema);

export default Group;
