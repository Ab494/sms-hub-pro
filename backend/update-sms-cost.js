#!/usr/bin/env node

/**
 * Update SMS Cost Script
 * Updates the SMS cost per unit in the database
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://cheruiyotevans646_db_user:Evans6042@cluster0.sd7of0h.mongodb.net/?appName=Cluster0';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set');
  process.exit(1);
}

async function updateSMSCost() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Update SMS cost to 0.46
    const result = await db.collection('platformsettings').updateOne(
      { key: 'sms_cost_per_unit' },
      {
        $set: {
          value: 0.46,
          description: 'Cost paid to BlessedTexts per SMS unit (updated to 0.46 KES)',
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ SMS cost updated to 0.46 KES per unit');
    } else {
      console.log('⚠️  No changes made (setting might already be 0.46)');
    }

    // Verify the update
    const setting = await db.collection('platformsettings').findOne({ key: 'sms_cost_per_unit' });
    console.log('Current SMS cost setting:', {
      key: setting.key,
      value: setting.value,
      description: setting.description
    });

    // Also update admin user credits if needed
    const adminUser = await db.collection('users').findOne({ email: 'admin@smshubpro.com' });
    if (adminUser) {
      console.log(`👑 Admin user credits: ${adminUser.smsBalance}`);
    }

    await mongoose.disconnect();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

updateSMSCost();