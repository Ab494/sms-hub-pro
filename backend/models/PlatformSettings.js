import mongoose from 'mongoose';

/**
 * PlatformSettings Model
 * Stores global platform pricing and configuration
 */

const platformSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: [
      'sms_price_per_unit',      // Price to charge companies per SMS unit
      'sms_cost_per_unit',       // Cost to pay BlessedTexts per SMS unit
      'minimum_credit_purchase', // Minimum credits to buy
      'bonus_credits_percent',  // Bonus credits on purchase (e.g., 10%)
      'default_sender_id',       // Default sender ID
      'currency',                // Currency (KES)
      'payment_methods',         // Available payment methods
      'business_name',           // Business name for invoices
      'contact_email',           // Contact email
      'contact_phone'            // Contact phone
    ]
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: true // Whether this setting is visible to users
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Note: Index on 'key' is automatically created by 'unique: true' above

// Static method to get pricing settings
platformSettingsSchema.statics.getPricing = async function() {
  const settings = await this.find({ key: { $in: [
    'sms_price_per_unit',
    'sms_cost_per_unit',
    'minimum_credit_purchase',
    'bonus_credits_percent',
    'currency'
  ]}});
  
  const pricing = {};
  settings.forEach(s => {
    pricing[s.key] = s.value;
  });
  
  // Set defaults if not configured
  return {
    sms_price_per_unit: pricing.sms_price_per_unit || 0.46,
    sms_cost_per_unit: pricing.sms_cost_per_unit || 0.35,
    minimum_credit_purchase: pricing.minimum_credit_purchase || 50,
    bonus_credits_percent: pricing.bonus_credits_percent || 0,
    currency: pricing.currency || 'KES'
  };
};

// Static method to initialize default settings
platformSettingsSchema.statics.initializeDefaults = async function() {
  const defaults = [
    { key: 'sms_price_per_unit', value: 0.50, description: 'Price per SMS unit charged to companies', isPublic: true },
    { key: 'sms_cost_per_unit', value: 0.35, description: 'Cost per SMS unit paid to BlessedTexts', isPublic: false },
    { key: 'minimum_credit_purchase', value: 100, description: 'Minimum credits to purchase', isPublic: true },
    { key: 'bonus_credits_percent', value: 0, description: 'Bonus credits percentage on purchase', isPublic: true },
    { key: 'default_sender_id', value: 'FERRITE', description: 'Default sender ID', isPublic: true },
    { key: 'currency', value: 'KES', description: 'Currency', isPublic: true },
    { key: 'payment_methods', value: ['mpesa', 'bank_transfer'], description: 'Available payment methods', isPublic: true }
  ];
  
  for (const setting of defaults) {
    await this.findOneAndUpdate(
      { key: setting.key },
      setting,
      { upsert: true, new: true }
    );
  }
};

const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);

export default PlatformSettings;