const axios = require('axios');

async function testLoginFlow() {
  const baseURL = 'http://localhost:3000';
  
  console.log('🧪 Testing Kisaan Connect Login Flow\n');

  try {
    // Test 1: Register a new user
    console.log('1️⃣ Testing Registration...');
    const registerData = {
      fullName: 'Login Test User',
      phoneNumber: '9999999999',
      email: 'logintest@example.com',
      password: 'password123',
      inputState: 'Karnataka',
      inputDistrict: 'Bangalore',
      village_town: 'Electronic City',
      pinCode: '560100'
    };

    try {
      const registerResponse = await axios.post(`${baseURL}/register`, registerData, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Registration successful:', registerResponse.data);
    } catch (registerError) {
      if (registerError.response?.status === 400) {
        console.log('ℹ️ User already exists, proceeding with login test');
      } else {
        console.log('❌ Registration failed:', registerError.response?.data || registerError.message);
        return;
      }
    }

    // Test 2: Login with email (JSON format)
    console.log('\n2️⃣ Testing Login with Email (JSON)...');
    try {
      const loginResponse = await axios.post(`${baseURL}/login`, {
        emailPhone: 'logintest@example.com',
        password: 'password123'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Login successful (JSON):', loginResponse.data);
    } catch (loginError) {
      console.log('❌ Login failed (JSON):', loginError.response?.data || loginError.message);
    }

    // Test 3: Login with phone number (JSON format)
    console.log('\n3️⃣ Testing Login with Phone (JSON)...');
    try {
      const loginResponse = await axios.post(`${baseURL}/login`, {
        emailPhone: '9999999999',
        password: 'password123'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Login successful with phone (JSON):', loginResponse.data);
    } catch (loginError) {
      console.log('❌ Login failed with phone (JSON):', loginError.response?.data || loginError.message);
    }

    // Test 4: Login with form data (like the HTML form)
    console.log('\n4️⃣ Testing Login with Form Data...');
    const formData = new URLSearchParams();
    formData.append('emailPhone', 'logintest@example.com');
    formData.append('password', 'password123');

    try {
      const loginResponse = await axios.post(`${baseURL}/login`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      console.log('✅ Login successful (Form Data):', loginResponse.data);
    } catch (loginError) {
      console.log('❌ Login failed (Form Data):', loginError.response?.data || loginError.message);
    }

    // Test 5: Test wrong password
    console.log('\n5️⃣ Testing Wrong Password...');
    try {
      const loginResponse = await axios.post(`${baseURL}/login`, {
        emailPhone: 'logintest@example.com',
        password: 'wrongpassword'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('❌ This should not succeed');
    } catch (loginError) {
      console.log('✅ Correctly rejected wrong password:', loginError.response?.data || loginError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLoginFlow();
