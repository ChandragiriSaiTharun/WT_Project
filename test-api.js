const http = require('http');

// Test GET request
function testGetPrices() {
  console.log('Testing GET /api/market-prices...');
  
  const req = http.get('http://localhost:3000/api/market-prices', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('GET Response Status:', res.statusCode);
      console.log('GET Response:', data);
      
      // Test seed after GET
      testSeedData();
    });
  });
  
  req.on('error', err => {
    console.error('GET Error:', err.message);
    testSeedData();
  });
  
  req.setTimeout(5000, () => {
    console.log('GET Request timed out');
    req.destroy();
    testSeedData();
  });
}

// Test POST request to seed data
function testSeedData() {
  console.log('\nTesting POST /api/market-prices/seed...');
  
  const postData = '';
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/market-prices/seed',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('POST Response Status:', res.statusCode);
      console.log('POST Response:', data);
      process.exit(0);
    });
  });

  req.on('error', err => {
    console.error('POST Error:', err.message);
    process.exit(1);
  });

  req.setTimeout(10000, () => {
    console.log('POST Request timed out');
    req.destroy();
    process.exit(1);
  });

  req.write(postData);
  req.end();
}

// Start testing
testGetPrices();
