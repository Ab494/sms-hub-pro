#!/usr/bin/env node

/**
 * Production Environment Checker & SMS Debug Script
 * Run this to diagnose deployment issues
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import axios from 'axios';

const API_BASE_URL = 'https://sms.blessedtexts.com/api/sms/v1';

async function checkEnvironment() {
  console.log('🔍 Checking Production Environment...\n');

  // Check required environment variables
  const requiredVars = [
    'NODE_ENV',
    'MONGODB_URI',
    'JWT_SECRET',
    'BLESSEDTEXTS_API_KEY',
    'CLIENT_URL'
  ];

  console.log('📋 Environment Variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    const displayValue = value ? (varName.includes('SECRET') || varName.includes('KEY') ? '***' + value.slice(-4) : value) : 'NOT SET';
    console.log(`  ${status} ${varName}: ${displayValue}`);
  });

  // Check database connection
  console.log('\n🗄️  Database Connection:');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('  ✅ MongoDB connected successfully');

    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log(`  📊 Collections found: ${collectionNames.join(', ')}`);

    // Check users count
    const userCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`  👥 Total users: ${userCount}`);

    // Check admin users
    const adminCount = await mongoose.connection.db.collection('users').countDocuments({ role: 'admin' });
    console.log(`  👑 Admin users: ${adminCount}`);

    await mongoose.disconnect();
  } catch (error) {
    console.log('  ❌ MongoDB connection failed:', error.message);
  }

  // Check SMS API
  console.log('\n📱 SMS API Configuration:');
  if (!process.env.BLESSEDTEXTS_API_KEY) {
    console.log('  ❌ BLESSEDTEXTS_API_KEY not set');
  } else {
    try {
      // Test API key with balance check
      const response = await axios.get(`${API_BASE_URL}/account/balance`, {
        params: { api_key: process.env.BLESSEDTEXTS_API_KEY }
      });
      console.log('  ✅ SMS API key valid');
      console.log(`  💰 Balance: ${response.data.balance || 'Unknown'}`);
    } catch (error) {
      console.log('  ❌ SMS API key invalid or API unreachable');
      console.log(`  Error: ${error.response?.data?.message || error.message}`);
    }
  }

  // Check platform settings
  console.log('\n⚙️  Platform Settings:');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const settings = await mongoose.connection.db.collection('platformsettings').find({}).toArray();

    if (settings.length === 0) {
      console.log('  ❌ No platform settings found. Run initialization script.');
    } else {
      console.log(`  ✅ ${settings.length} settings configured`);
      settings.forEach(setting => {
        console.log(`    - ${setting.key}: ${setting.value}`);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.log('  ❌ Could not check platform settings');
  }

  console.log('\n🎯 Quick Fix Commands:');
  console.log('1. Set missing environment variables in Render dashboard');
  console.log('2. Test SMS API key:');
  console.log(`   curl "${API_BASE_URL}/account/balance?api_key=YOUR_API_KEY"`);
  console.log('3. Initialize platform settings (run in MongoDB shell):');
  console.log('   See DEPLOYMENT.md for initialization script');
  console.log('4. Create admin user (run in MongoDB shell):');
  console.log(`   db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })`);

  console.log('\n🚀 If all checks pass, your deployment should work!');
}

// Test SMS sending (optional)
async function testSMSSend() {
  if (process.argv[2] === '--test-sms') {
    console.log('\n🧪 Testing SMS Send...');

    const testPhone = process.argv[3] || '254712345678';
    const testMessage = 'Test SMS from SMS Hub Pro deployment';

    try {
      const response = await axios.post(`${API_BASE_URL}/sendsms`, {
        api_key: process.env.BLESSEDTEXTS_API_KEY,
        sender_id: process.env.BLESSEDTEXTS_SENDER || 'FERRITE',
        message: testMessage,
        phone: testPhone
      });

      console.log('  ✅ SMS sent successfully');
      console.log(`  📨 Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.log('  ❌ SMS send failed');
      console.log(`  Error: ${error.response?.data?.message || error.message}`);
    }
  }
}

checkEnvironment().then(() => {
  testSMSSend();
}).catch(console.error);