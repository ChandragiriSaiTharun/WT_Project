// Test script to check chat functionality
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testChatAPI() {
  console.log('🧪 Testing chat functionality...\n');
  
  try {
    // 1. Check debug endpoint
    console.log('1️⃣ Checking database status...');
    const debugResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/chats/debug',
      method: 'GET'
    });
    
    console.log('Debug Response:', debugResponse.body);
    console.log('');
    
    // 2. Try to start a chat without auth (should fail)
    console.log('2️⃣ Testing chat start without auth...');
    const noAuthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/chats/start',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      participantId: '507f1f77bcf86cd799439011',
      cropId: '507f1f77bcf86cd799439012'
    });
    
    console.log('No Auth Response:', noAuthResponse.status, noAuthResponse.body);
    console.log('');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testChatAPI();
