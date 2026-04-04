#!/usr/bin/env node

/**
 * Quick Deployment Checklist
 * Run this before going live
 */

console.log('🚀 SMS Hub Pro - Deployment Checklist\n');

const checks = [
  {
    name: 'Environment Variables',
    items: [
      { name: 'NODE_ENV', required: true, env: 'NODE_ENV' },
      { name: 'MONGODB_URI', required: true, env: 'MONGODB_URI' },
      { name: 'JWT_SECRET', required: true, env: 'JWT_SECRET' },
      { name: 'BLESSEDTEXTS_API_KEY', required: true, env: 'BLESSEDTEXTS_API_KEY' },
      { name: 'CLIENT_URL', required: true, env: 'CLIENT_URL' },
      { name: 'DEFAULT_SENDER_ID', required: false, env: 'DEFAULT_SENDER_ID' },
      { name: 'MPESA_CONSUMER_KEY', required: false, env: 'MPESA_CONSUMER_KEY' }
    ]
  },
  {
    name: 'Services',
    items: [
      { name: 'MongoDB Connection', manual: true },
      { name: 'BlessedTexts API', manual: true },
      { name: 'M-Pesa Integration', manual: true }
    ]
  },
  {
    name: 'Database Setup',
    items: [
      { name: 'Users collection exists', manual: true },
      { name: 'Admin user created', manual: true },
      { name: 'Platform settings initialized', manual: true }
    ]
  },
  {
    name: 'API Endpoints',
    items: [
      { name: 'Health check (/api/health)', manual: true },
      { name: 'Authentication (/api/auth)', manual: true },
      { name: 'SMS sending (/api/sms)', manual: true }
    ]
  }
];

let allGood = true;

checks.forEach(section => {
  console.log(`📋 ${section.name}:`);
  section.items.forEach(item => {
    if (item.env) {
      const value = process.env[item.env];
      const status = (item.required && !value) ? '❌' : value ? '✅' : '⚠️ ';
      const displayValue = value ? (item.env.includes('SECRET') || item.env.includes('KEY') ? '***configured' : 'configured') : 'NOT SET';
      console.log(`  ${status} ${item.name}: ${displayValue}`);
      if (item.required && !value) allGood = false;
    } else if (item.manual) {
      console.log(`  ⏳ ${item.name}: Check manually`);
    }
  });
  console.log('');
});

console.log('🔧 Quick Commands:');
console.log('1. Check environment: cd backend && npm run check');
console.log('2. Initialize platform: cd backend && npm run init');
console.log('3. Test SMS: cd backend && npm run test-sms 0712345678');
console.log('');

if (allGood) {
  console.log('✅ All required environment variables are set!');
  console.log('🎉 Ready for deployment!');
} else {
  console.log('❌ Some required environment variables are missing.');
  console.log('📖 Check DEPLOYMENT.md for setup instructions.');
}

console.log('\n📱 Production URLs:');
console.log('- Frontend: https://your-frontend-domain.com');
console.log('- Backend: https://your-backend.onrender.com');
console.log('- Health: https://your-backend.onrender.com/api/health');