/**
 * Integration Test for Docker Compose Startup
 * Feature: docker-support, Property 1: Service accessibility
 * Validates: Requirements 1.2, 1.3
 */

const { execSync, spawn } = require('child_process');
const http = require('http');
const { MongoClient } = require('mongodb');

describe('Docker Compose Integration Tests', () => {
  let composeProcess;
  const STARTUP_TIMEOUT = 120000; // 2 minutes for full stack startup
  const API_URL = 'http://localhost:3000';
  const FRONTEND_URL = 'http://localhost:3001';
  const MONGODB_URI = 'mongodb://localhost:27017';

  beforeAll(async () => {
    // Clean up any existing containers
    try {
      execSync('docker-compose down -v --remove-orphans', { stdio: 'ignore' });
    } catch (error) {
      // Ignore errors if no containers exist
    }

    // Start Docker Compose services
    console.log('Starting Docker Compose services...');
    composeProcess = spawn('docker-compose', ['up', '--build'], {
      detached: false,
      stdio: 'pipe'
    });

    // Wait for services to be ready
    await waitForServicesReady();
  }, STARTUP_TIMEOUT);

  afterAll(async () => {
    // Clean up Docker Compose services
    if (composeProcess) {
      composeProcess.kill('SIGTERM');
    }
    
    try {
      execSync('docker-compose down -v --remove-orphans', { stdio: 'ignore' });
    } catch (error) {
      console.warn('Error during cleanup:', error.message);
    }
  });

  /**
   * Property 1: Service accessibility
   * For any running Docker Compose stack, all configured services should be accessible on their designated ports
   * Validates: Requirements 1.2, 1.3
   */
  describe('Property 1: Service accessibility', () => {
    test('API service should be accessible at http://localhost:3000', async () => {
      const isAccessible = await checkServiceAccessibility(API_URL);
      expect(isAccessible).toBe(true);
    });

    test('Frontend service should be accessible at http://localhost:3001', async () => {
      const isAccessible = await checkServiceAccessibility(FRONTEND_URL);
      expect(isAccessible).toBe(true);
    });

    test('MongoDB service should be accessible internally to API service', async () => {
      // Test MongoDB connectivity through API health check
      const response = await makeHttpRequest(`${API_URL}/health`);
      expect(response.statusCode).toBe(200);
      
      // Also test direct MongoDB connection
      const isMongoAccessible = await checkMongoDBAccessibility();
      expect(isMongoAccessible).toBe(true);
    });

    test('All services should respond within reasonable time', async () => {
      const startTime = Date.now();
      
      const [apiResponse, frontendResponse] = await Promise.all([
        makeHttpRequest(API_URL),
        makeHttpRequest(FRONTEND_URL)
      ]);
      
      const responseTime = Date.now() - startTime;
      
      expect(apiResponse.statusCode).toBeLessThan(500);
      expect(frontendResponse.statusCode).toBeLessThan(500);
      expect(responseTime).toBeLessThan(10000); // 10 seconds max
    });

    test('Services should maintain accessibility after initial startup', async () => {
      // Wait a bit and test again to ensure stability
      await sleep(5000);
      
      const apiAccessible = await checkServiceAccessibility(API_URL);
      const frontendAccessible = await checkServiceAccessibility(FRONTEND_URL);
      
      expect(apiAccessible).toBe(true);
      expect(frontendAccessible).toBe(true);
    });
  });

  // Helper functions
  async function waitForServicesReady() {
    const maxAttempts = 60; // 2 minutes with 2-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const [apiReady, frontendReady, mongoReady] = await Promise.all([
          checkServiceAccessibility(API_URL),
          checkServiceAccessibility(FRONTEND_URL),
          checkMongoDBAccessibility()
        ]);

        if (apiReady && frontendReady && mongoReady) {
          console.log('All services are ready!');
          return;
        }
      } catch (error) {
        // Continue waiting
      }

      attempts++;
      await sleep(2000);
    }

    throw new Error('Services failed to start within timeout period');
  }

  async function checkServiceAccessibility(url) {
    try {
      const response = await makeHttpRequest(url);
      return response.statusCode < 500;
    } catch (error) {
      return false;
    }
  }

  async function checkMongoDBAccessibility() {
    try {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      await client.db('admin').command({ ping: 1 });
      await client.close();
      return true;
    } catch (error) {
      return false;
    }
  }

  function makeHttpRequest(url) {
    return new Promise((resolve, reject) => {
      const request = http.get(url, (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            data: data
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

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
});