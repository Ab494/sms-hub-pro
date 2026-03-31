import mongoose from 'mongoose';

/**
 * Contact Model
 * Stores phone contacts for users
 */

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  notes: {
    type: String,
    default: null,
    maxlength: [500, 'Notes cannot exceed 500 characters']
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

// Compound index for efficient user contact queries
contactSchema.index({ userId: 1, phone: 1 }, { unique: true });
contactSchema.index({ userId: 1, groupId: 1 });

/**
 * Virtual for formatted phone number
 */
contactSchema.virtual('formattedPhone').get(function() {
  if (!this.phone) return null;
  
  // Format phone number for display
  const phone = this.phone.replace(/\D/g, '');
  
  if (phone.startsWith('254')) {
    return `+${phone.substring(0, 3)} ${phone.substring(3, 6)} ${phone.substring(6)}`;
  } else if (phone.startsWith('0')) {
    return `+254 ${phone.substring(1, 4)} ${phone.substring(4)}`;
  }
  
  return this.phone;
});

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
