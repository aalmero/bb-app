#!/usr/bin/env node

/**
 * Test script for Docker health check endpoints
 * This script validates that all health check endpoints return expected responses
 */

const http = require('http');

// Test configuration
const tests = [
  {
    name: 'API Health Check',
    host: 'localhost',
    port: 3000,
    path: '/health',
    expectedStatus: 200,
    expectedFields: ['status', 'timestamp', 'service', 'database', 'uptime', 'memory', 'metrics']
  },
  {
    name: 'API Readiness Check',
    host: 'localhost',
    port: 3000,
    path: '/ready',
    expectedStatus: [200, 503], // Can be either depending on DB state
    expectedFields: ['status', 'timestamp', 'service']
  },
  {
    name: 'API Liveness Check',
    host: 'localhost',
    port: 3000,
    path: '/live',
    expectedStatus: 200,
    expectedFields: ['status', 'timestamp', 'service', 'uptime']
  },
  {
    name: 'Frontend Health Check',
    host: 'localhost',
    port: 3001,
    path: '/health',
    expectedStatus: 200,
    expectedContentType: 'text/html' // Vite dev server
  }
];

async function makeRequest(host, port, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTest(test) {
  console.log(`\n🧪 Testing: ${test.name}`);
  console.log(`   URL: http://${test.host}:${test.port}${test.path}`);
  
  try {
    const response = await makeRequest(test.host, test.port, test.path);
    
    // Check status code
    const expectedStatuses = Array.isArray(test.expectedStatus) ? test.expectedStatus : [test.expectedStatus];
    if (!expectedStatuses.includes(response.statusCode)) {
      console.log(`   ❌ Status code mismatch. Expected: ${test.expectedStatus}, Got: ${response.statusCode}`);
      return false;
    }
    
    console.log(`   ✅ Status code: ${response.statusCode}`);
    
    // Try to parse JSON response
    if (test.expectedFields) {
      try {
        const jsonData = JSON.parse(response.body);
        console.log(`   ✅ Valid JSON response`);
        
        // Check required fields
        const missingFields = test.expectedFields.filter(field => !(field in jsonData));
        if (missingFields.length > 0) {
          console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
          return false;
        }
        
        console.log(`   ✅ All required fields present: ${test.expectedFields.join(', ')}`);
        console.log(`   📊 Response data:`, JSON.stringify(jsonData, null, 4));
        
      } catch (parseError) {
        console.log(`   ❌ Invalid JSON response: ${parseError.message}`);
        console.log(`   📄 Raw response: ${response.body.substring(0, 200)}...`);
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Docker Health Check Tests');
  console.log('=====================================');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await runTest(test);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All health check tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some health check tests failed. Check the services are running.');
    console.log('   To start services: docker-compose up -d');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});