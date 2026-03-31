import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Model
 * Stores user account information with authentication data
 */

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  company: {
    type: String,
    trim: true,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  smsBalance: {
    type: Number,
    default: 10
  },
  senderId: {
    type: String,
    trim: true,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  passwordChangedAt: {
    type: Date,
    default: null
  },
  avatar: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Remove duplicate index - index is already defined in schema above
// userSchema.index({ email: 1 });

// Virtual for contact count
userSchema.virtual('contacts', {
  ref: 'Contact',
  localField: '_id',
  foreignField: 'userId'
});

/**
 * Hash password before saving
 */
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Compare entered password with hashed password
 */
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Check if password was changed after token was issued
 */
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

export default User;
