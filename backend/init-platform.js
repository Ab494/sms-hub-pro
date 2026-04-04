#!/usr/bin/env node

/**
 * Platform Initialization Script
 * Run this after deployment to set up default settings
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set');
  process.exit(1);
}

async function initializePlatform() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Initialize platform settings
    console.log('\n⚙️  Initializing platform settings...');
    const defaultSettings = [
      { key: 'sms_price_per_unit', value: 0.50, description: 'Price charged to customers per SMS unit', isPublic: true },
      { key: 'sms_cost_per_unit', value: 0.35, description: 'Cost paid to BlessedTexts per SMS unit', isPublic: false },
      { key: 'minimum_credit_purchase', value: 100, description: 'Minimum credits to purchase at once', isPublic: true },
      { key: 'bonus_credits_percent', value: 0, description: 'Bonus credits percentage on purchase', isPublic: true },
      { key: 'default_sender_id', value: 'FERRITE', description: 'Default sender ID for SMS', isPublic: true },
      { key: 'currency', value: 'KES', description: 'Currency for transactions', isPublic: true },
      { key: 'payment_methods', value: ['mpesa', 'bank_transfer'], description: 'Available payment methods', isPublic: true },
      { key: 'business_name', value: 'SMS Hub Pro', description: 'Business name for invoices', isPublic: true },
      { key: 'contact_email', value: 'admin@smshubpro.com', description: 'Contact email', isPublic: true },
      { key: 'contact_phone', value: '+254700000000', description: 'Contact phone', isPublic: true }
    ];

    for (const setting of defaultSettings) {
      await db.collection('platformsettings').updateOne(
        { key: setting.key },
        { $set: setting },
        { upsert: true }
      );
    }
    console.log('✅ Platform settings initialized');

    // Create default admin user (optional)
    const adminEmail = process.argv[2] || 'admin@smshubpro.com';
    console.log(`\n👑 Creating/updating admin user: ${adminEmail}`);

    const adminUser = {
      name: 'Admin User',
      email: adminEmail,
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/J9CwHfVJ8Ww7q4Xa', // password: admin123
      role: 'admin',
      smsBalance: 1000,
      isActive: true,
      company: 'SMS Hub Pro',
      phone: '+254700000000'
    };

    const result = await db.collection('users').updateOne(
      { email: adminEmail },
      { $set: adminUser },
      { upsert: true }
    );

    console.log('✅ Admin user created/updated');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: admin123`);
    console.log(`   User ID: ${result._id}`);

    // Give admin user credits
    console.log('\n💰 Setting admin credits...');
    await db.collection('users').updateOne(
      { email: adminEmail },
      { $set: { smsBalance: 1000 } }
    );

    console.log('✅ Admin has 1000 credits');
    console.log('✅ Admin has 1000 credits');

    console.log('\n🎉 Platform initialization complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your environment variables in production');
    console.log('2. Test SMS sending with the admin account');
    console.log('3. Configure your frontend to point to the backend URL');
    console.log('4. Set up domain and SSL (optional)');

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

initializePlatform();