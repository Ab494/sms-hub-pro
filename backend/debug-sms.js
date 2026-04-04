#!/usr/bin/env node

/**
 * SMS API Debug Script
 * Test different BlessedTexts API endpoints
 */

import axios from 'axios';
import 'dotenv/config';

const API_KEY = process.env.BLESSEDTEXTS_API_KEY || '91a4ff20fbac44cd8c0e300a19cfba55';

const endpoints = [
  'https://sms.blessedtexts.com/api/sms/v1/account/balance',
  'https://app.blessedtextsms.com/api/account/balance',
  'https://app.blessedtextsms.com/api/balance',
  'https://api.blessedtexts.com/balance',
];

async function testEndpoint(url) {
  try {
    console.log(`Testing: ${url}`);
    const response = await axios.get(`${url}?api_key=${API_KEY}`, {
      timeout: 10000,
      headers: { 'Accept': 'application/json' }
    });

    console.log(`✅ Success: ${response.status}`);
    console.log(`Response:`, response.data);
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.response?.status || 'Network Error'}`);
    if (error.response?.data) {
      console.log(`Error:`, error.response.data);
    }
    return false;
  }
}

async function testSendSMS() {
  const payloads = [
    // Format 1: to array
    {
      api_key: API_KEY,
      sender: 'TEST',
      to: ['0712345678'],
      message: 'Test SMS from API debug'
    },
    // Format 2: phone string
    {
      api_key: API_KEY,
      sender_id: 'TEST',
      phone: '0712345678',
      message: 'Test SMS from API debug'
    },
    // Format 3: phone array
    {
      api_key: API_KEY,
      sender_id: 'TEST',
      phone: ['0712345678'],
      message: 'Test SMS from API debug'
    }
  ];

  const sendEndpoints = [
    'https://app.blessedtextsms.com/api/send',
    'https://sms.blessedtexts.com/api/sms/v1/sendsms'
  ];

  for (const url of sendEndpoints) {
    for (let i = 0; i < payloads.length; i++) {
      try {
        console.log(`\nTesting SMS send: ${url} (Format ${i + 1})`);
        console.log('Payload:', payloads[i]);

        const response = await axios.post(url, payloads[i], {
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' }
        });

        console.log(`✅ SMS Send Success: ${response.status}`);
        console.log(`Response:`, response.data);
        return true;
      } catch (error) {
        console.log(`❌ SMS Send Failed: ${error.response?.status || 'Network Error'}`);
        if (error.response?.data) {
          console.log(`Error:`, error.response.data);
        }
      }
    }
  }

  return false;
}

async function main() {
  console.log('🔍 Testing BlessedTexts API Endpoints...\n');
  console.log(`API Key: ${API_KEY.substring(0, 8)}...${API_KEY.slice(-4)}\n`);

  let foundWorking = false;

  // Test balance endpoints
  for (const endpoint of endpoints) {
    if (await testEndpoint(endpoint)) {
      foundWorking = true;
      console.log(`🎉 Working balance endpoint: ${endpoint}\n`);
      break;
    }
    console.log('');
  }

  if (!foundWorking) {
    console.log('❌ No working balance endpoints found');
  }

  // Test SMS sending
  console.log('📱 Testing SMS sending...');
  if (await testSendSMS()) {
    console.log('🎉 SMS sending works!');
  } else {
    console.log('❌ SMS sending failed');
  }

  console.log('\n📋 Recommendations:');
  console.log('1. Check your BlessedTexts dashboard for the correct API key');
  console.log('2. Verify your account has SMS credits');
  console.log('3. Check BlessedTexts API documentation for current endpoints');
  console.log('4. Contact BlessedTexts support if API key is invalid');
}

main().catch(console.error);