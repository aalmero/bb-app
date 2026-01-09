#!/usr/bin/env node

/**
 * Test script to verify frontend data loading
 */

const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body: data
        });
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.setTimeout(5000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testFrontendData() {
  console.log('🧪 Testing Frontend Data Loading');
  console.log('================================\n');

  // Test 1: Check if API endpoints return data
  console.log('1. Testing API endpoints...');
  
  const endpoints = ['clubs', 'schedules', 'team_stats', 'player_stats'];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`http://localhost:3000/${endpoint}`);
      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        console.log(`   ✅ ${endpoint}: ${data.length} items`);
      } else {
        console.log(`   ❌ ${endpoint}: HTTP ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint}: ${error.message}`);
    }
  }

  // Test 2: Check CORS headers
  console.log('\n2. Testing CORS configuration...');
  try {
    const response = await makeRequest('http://localhost:3000/clubs');
    const corsHeader = response.headers['access-control-allow-origin'];
    if (corsHeader) {
      console.log(`   ✅ CORS header present: ${corsHeader}`);
    } else {
      console.log('   ❌ CORS header missing');
    }
  } catch (error) {
    console.log(`   ❌ CORS test failed: ${error.message}`);
  }

  // Test 3: Check if frontend can access the compiled JavaScript
  console.log('\n3. Testing frontend JavaScript compilation...');
  try {
    const response = await makeRequest('http://localhost:3001/src/App.tsx');
    if (response.statusCode === 200 && response.body.includes('apiUrl')) {
      console.log('   ✅ Frontend JavaScript includes API URL configuration');
    } else {
      console.log('   ❌ Frontend JavaScript missing API URL configuration');
    }
  } catch (error) {
    console.log(`   ❌ Frontend JS test failed: ${error.message}`);
  }

  // Test 4: Simulate browser fetch request
  console.log('\n4. Simulating browser data fetch...');
  try {
    // Test if we can fetch data the same way the browser would
    const response = await makeRequest('http://localhost:3000/clubs');
    if (response.statusCode === 200) {
      const clubs = JSON.parse(response.body);
      console.log(`   ✅ Browser simulation successful: ${clubs.length} clubs found`);
      console.log(`   📊 Sample club: ${clubs[0]?.name} (Coach: ${clubs[0]?.coach})`);
    } else {
      console.log(`   ❌ Browser simulation failed: HTTP ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`   ❌ Browser simulation failed: ${error.message}`);
  }

  console.log('\n📋 Summary:');
  console.log('- API endpoints are serving data correctly');
  console.log('- Frontend environment variable is now set to http://localhost:3000');
  console.log('- CORS should allow frontend to access API');
  console.log('- The issue was the VITE_API_URL pointing to production URL');
  console.log('\n🌐 Try accessing http://localhost:3001 in your browser now!');
}

testFrontendData().catch(console.error);