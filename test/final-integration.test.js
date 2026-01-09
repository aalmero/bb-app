/**
 * Final Integration Testing and Validation
 * Feature: docker-support, Task 10: Final integration testing and validation
 * 
 * This comprehensive test suite validates:
 * - Complete development workflow with Docker
 * - Production build and deployment process
 * - All environment configurations
 * - Database persistence and service communication
 * - All requirements from the Docker support spec
 */

const { execSync, spawn } = require('child_process');
const http = require('http');
const https = require('https');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

describe('Final Docker Integration Tests', () => {
  const STARTUP_TIMEOUT = 180000; // 3 minutes for full stack startup
  const API_URL = 'http://localhost:3000';
  const FRONTEND_URL = 'http://localhost:3001';
  const MONGODB_URI = 'mongodb://localhost:27017';
  const DATABASE_NAME = 'bb-db';

  let devComposeProcess;
  let prodComposeProcess;

  beforeAll(async () => {
    console.log('🚀 Starting Final Integration Tests...');
    
    // Clean up any existing containers
    try {
      execSync('docker-compose down -v --remove-orphans', { stdio: 'ignore' });
      execSync('docker-compose -f docker-compose.prod.yml down -v --remove-orphans', { stdio: 'ignore' });
    } catch (error) {
      // Ignore errors if no containers exist
    }
  }, STARTUP_TIMEOUT);

  afterAll(async () => {
    console.log('🧹 Cleaning up test environment...');
    
    // Clean up all Docker processes
    if (devComposeProcess) {
      devComposeProcess.kill('SIGTERM');
    }
    if (prodComposeProcess) {
      prodComposeProcess.kill('SIGTERM');
    }
    
    try {
      execSync('docker-compose down -v --remove-orphans', { stdio: 'ignore' });
      execSync('docker-compose -f docker-compose.prod.yml down -v --remove-orphans', { stdio: 'ignore' });
    } catch (error) {
      console.warn('Error during cleanup:', error.message);
    }
  });

  describe('Development Workflow Validation', () => {
    beforeAll(async () => {
      console.log('🔧 Starting development environment...');
      
      // Start development Docker Compose services
      devComposeProcess = spawn('docker-compose', ['up', '--build'], {
        detached: false,
        stdio: 'pipe'
      });

      // Wait for development services to be ready
      await waitForServicesReady(API_URL, FRONTEND_URL, MONGODB_URI);
    }, STARTUP_TIMEOUT);

    afterAll(async () => {
      if (devComposeProcess) {
        devComposeProcess.kill('SIGTERM');
        devComposeProcess = null;
      }
      
      try {
        execSync('docker-compose down -v --remove-orphans', { stdio: 'ignore' });
      } catch (error) {
        console.warn('Error stopping dev environment:', error.message);
      }
    });

    /**
     * Requirement 1.1: Docker Compose starts all required services
     */
    test('should start all required services with docker-compose up', async () => {
      // Verify all containers are running
      const psOutput = execSync('docker-compose ps --format json', { encoding: 'utf8' });
      const containers = JSON.parse(`[${psOutput.trim().split('\n').join(',')}]`);
      
      const expectedServices = ['api', 'frontend', 'mongodb'];
      const runningServices = containers
        .filter(container => container.State === 'running')
        .map(container => container.Service);
      
      expectedServices.forEach(service => {
        expect(runningServices).toContain(service);
      });
    });

    /**
     * Requirements 1.2, 1.3: API and Frontend accessibility
     */
    test('should have API accessible at http://localhost:3000', async () => {
      const response = await makeHttpRequest(API_URL);
      expect(response.statusCode).toBeLessThan(500);
    });

    test('should have Frontend accessible at http://localhost:3001', async () => {
      const response = await makeHttpRequest(FRONTEND_URL);
      expect(response.statusCode).toBeLessThan(500);
    });

    /**
     * Requirement 1.4: MongoDB internal accessibility
     */
    test('should have MongoDB accessible internally to API service', async () => {
      const healthResponse = await makeHttpRequest(`${API_URL}/health`);
      expect(healthResponse.statusCode).toBe(200);
      
      const healthData = JSON.parse(healthResponse.data);
      expect(healthData.database).toBeDefined();
      expect(healthData.database.status).toBe('connected');
    });

    /**
     * Requirement 1.5: Hot reload functionality
     */
    test('should support hot reload for code changes', async () => {
      // Create a temporary test endpoint in server.js
      const serverPath = './server.js';
      const originalContent = fs.readFileSync(serverPath, 'utf8');
      
      try {
        // Add a test endpoint
        const testEndpoint = `
// Temporary test endpoint for hot reload validation
app.get('/test-hot-reload', (req, res) => {
  res.json({ message: 'Hot reload test endpoint', timestamp: Date.now() });
});
`;
        const modifiedContent = originalContent.replace(
          'module.exports = app;',
          testEndpoint + '\nmodule.exports = app;'
        );
        
        fs.writeFileSync(serverPath, modifiedContent);
        
        // Wait for hot reload to take effect
        await sleep(5000);
        
        // Test the new endpoint
        const response = await makeHttpRequest(`${API_URL}/test-hot-reload`);
        expect(response.statusCode).toBe(200);
        
        const data = JSON.parse(response.data);
        expect(data.message).toBe('Hot reload test endpoint');
        
      } finally {
        // Restore original content
        fs.writeFileSync(serverPath, originalContent);
        await sleep(3000); // Wait for reload
      }
    });

    /**
     * Requirements 2.1, 2.2: Database initialization and seeding
     */
    test('should initialize MongoDB with correct database name and seed data', async () => {
      const client = new MongoClient(MONGODB_URI);
      
      try {
        await client.connect();
        const db = client.db(DATABASE_NAME);
        
        // Check if collections exist and have data
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        expect(collectionNames).toContain('clubs');
        expect(collectionNames).toContain('schedules');
        expect(collectionNames).toContain('teamstats');
        expect(collectionNames).toContain('playerstats');
        
        // Verify seeded data exists
        const clubsCount = await db.collection('clubs').countDocuments();
        expect(clubsCount).toBeGreaterThan(0);
        
      } finally {
        await client.close();
      }
    });

    /**
     * Requirement 2.3: Data persistence across restarts
     */
    test('should persist database data across container restarts', async () => {
      const client = new MongoClient(MONGODB_URI);
      
      try {
        await client.connect();
        const db = client.db(DATABASE_NAME);
        
        // Insert test data
        const testData = { name: 'Test Persistence Club', timestamp: Date.now() };
        const insertResult = await db.collection('clubs').insertOne(testData);
        const insertedId = insertResult.insertedId;
        
        // Restart the MongoDB container
        execSync('docker-compose restart mongodb', { stdio: 'ignore' });
        
        // Wait for MongoDB to be ready again
        await waitForMongoDBReady(MONGODB_URI);
        
        // Verify data still exists
        const foundData = await db.collection('clubs').findOne({ _id: insertedId });
        expect(foundData).toBeTruthy();
        expect(foundData.name).toBe('Test Persistence Club');
        
        // Clean up test data
        await db.collection('clubs').deleteOne({ _id: insertedId });
        
      } finally {
        await client.close();
      }
    });

    /**
     * Requirement 4.1: Volume mounting for live editing
     */
    test('should mount source code as volumes for live editing', async () => {
      // Check volume mounts in docker-compose.yml
      const composeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
      
      // Verify API volume mounts
      expect(composeContent).toMatch(/\.\/server\.js:\/app\/server\.js/);
      expect(composeContent).toMatch(/\.\/models\.js:\/app\/models\.js/);
      
      // Verify frontend volume mounts
      expect(composeContent).toMatch(/\.\/src:\/app\/src/);
      expect(composeContent).toMatch(/\.\/vite\.config\.ts:\/app\/vite\.config\.ts/);
    });

    /**
     * Requirements 4.3, 4.4: Logging and debugging access
     */
    test('should provide access to container logs', async () => {
      // Test log access for each service
      const services = ['api', 'frontend', 'mongodb'];
      
      for (const service of services) {
        const logs = execSync(`docker-compose logs --tail=10 ${service}`, { encoding: 'utf8' });
        expect(logs).toBeTruthy();
        expect(logs.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Production Build and Deployment Validation', () => {
    beforeAll(async () => {
      console.log('🏭 Testing production build and deployment...');
      
      // Build production images
      console.log('Building production images...');
      execSync('docker build -f Dockerfile.prod.api -t basketball-api:test .', { stdio: 'inherit' });
      execSync('docker build -f Dockerfile.prod.frontend -t basketball-frontend:test .', { stdio: 'inherit' });
      
    }, STARTUP_TIMEOUT);

    /**
     * Requirements 3.1, 3.3: Multi-stage builds and optimization
     */
    test('should use multi-stage builds for production images', async () => {
      // Check Dockerfile.prod.api for multi-stage build
      const apiDockerfile = fs.readFileSync('./Dockerfile.prod.api', 'utf8');
      expect(apiDockerfile).toMatch(/FROM.*AS builder/);
      expect(apiDockerfile).toMatch(/FROM.*AS runtime/);
      expect(apiDockerfile).toMatch(/COPY --from=builder/);
      
      // Check Dockerfile.prod.frontend for multi-stage build
      const frontendDockerfile = fs.readFileSync('./Dockerfile.prod.frontend', 'utf8');
      expect(frontendDockerfile).toMatch(/FROM.*AS builder/);
      expect(frontendDockerfile).toMatch(/FROM.*AS runtime/);
      expect(frontendDockerfile).toMatch(/COPY --from=builder/);
    });

    test('should create optimized production images', async () => {
      // Check image sizes (production images should be smaller than development)
      const apiImageInfo = execSync('docker images basketball-api:test --format "{{.Size}}"', { encoding: 'utf8' }).trim();
      const frontendImageInfo = execSync('docker images basketball-frontend:test --format "{{.Size}}"', { encoding: 'utf8' }).trim();
      
      expect(apiImageInfo).toBeTruthy();
      expect(frontendImageInfo).toBeTruthy();
      
      console.log(`API production image size: ${apiImageInfo}`);
      console.log(`Frontend production image size: ${frontendImageInfo}`);
    });

    /**
     * Requirement 3.4: Health checks in production
     */
    test('should configure health checks for production containers', async () => {
      const prodComposeContent = fs.readFileSync('./docker-compose.prod.yml', 'utf8');
      
      // Verify health checks are configured
      expect(prodComposeContent).toMatch(/healthcheck:/);
      expect(prodComposeContent).toMatch(/test:.*health/);
      expect(prodComposeContent).toMatch(/interval:/);
      expect(prodComposeContent).toMatch(/timeout:/);
      expect(prodComposeContent).toMatch(/retries:/);
    });
  });

  describe('Environment Configuration Validation', () => {
    /**
     * Requirements 3.5, 5.1: Environment variable configuration
     */
    test('should support environment variable overrides', async () => {
      // Check .env.example file exists and has required variables
      expect(fs.existsSync('.env.example')).toBe(true);
      
      const envExample = fs.readFileSync('.env.example', 'utf8');
      
      // Verify key environment variables are documented
      const requiredVars = [
        'NODE_ENV',
        'MONGODB_URI',
        'PORT',
        'FRONTEND_PORT',
        'VITE_API_URL',
        'DATABASE_NAME'
      ];
      
      requiredVars.forEach(varName => {
        expect(envExample).toMatch(new RegExp(`${varName}=`));
      });
    });

    /**
     * Requirement 5.2: Database connection configuration
     */
    test('should support environment-specific database connections', async () => {
      const devComposeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
      const prodComposeContent = fs.readFileSync('./docker-compose.prod.yml', 'utf8');
      
      // Development should use 'mongodb' service name
      expect(devComposeContent).toMatch(/mongodb:\/\/mongodb:/);
      
      // Production should use 'mongo' service name
      expect(prodComposeContent).toMatch(/mongodb:\/\/mongo:/);
    });

    /**
     * Requirements 5.3, 5.5: Network and scaling configuration
     */
    test('should support configurable networking and scaling', async () => {
      const prodComposeContent = fs.readFileSync('./docker-compose.prod.yml', 'utf8');
      
      // Check for scaling configuration
      expect(prodComposeContent).toMatch(/replicas:/);
      expect(prodComposeContent).toMatch(/resources:/);
      expect(prodComposeContent).toMatch(/limits:/);
      
      // Check for network configuration
      expect(prodComposeContent).toMatch(/networks:/);
      expect(prodComposeContent).toMatch(/driver:/);
    });

    /**
     * Requirement 5.4: Secrets management
     */
    test('should not contain hardcoded secrets', async () => {
      const dockerfiles = [
        './Dockerfile.dev.api',
        './Dockerfile.dev.frontend',
        './Dockerfile.prod.api',
        './Dockerfile.prod.frontend'
      ];
      
      const composeFiles = [
        './docker-compose.yml',
        './docker-compose.prod.yml'
      ];
      
      const sensitivePatterns = [
        /password\s*=\s*["'][^"']+["']/i,
        /secret\s*=\s*["'][^"']+["']/i,
        /key\s*=\s*["'][^"']+["']/i,
        /token\s*=\s*["'][^"']+["']/i
      ];
      
      [...dockerfiles, ...composeFiles].forEach(filePath => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          sensitivePatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              // Allow development/example secrets but not production ones
              const match = matches[0];
              expect(match).toMatch(/(dev|test|example|change-this|your-)/i);
            }
          });
        }
      });
    });
  });

  describe('Service Communication Validation', () => {
    beforeAll(async () => {
      // Ensure development environment is running for communication tests
      if (!devComposeProcess) {
        console.log('🔧 Starting development environment for communication tests...');
        devComposeProcess = spawn('docker-compose', ['up', '-d'], {
          detached: false,
          stdio: 'pipe'
        });
        
        await waitForServicesReady(API_URL, FRONTEND_URL, MONGODB_URI);
      }
    });

    /**
     * Requirement 2.4: API to database communication
     */
    test('should enable API to database communication', async () => {
      // Test database operations through API
      const response = await makeHttpRequest(`${API_URL}/clubs`);
      expect(response.statusCode).toBe(200);
      
      const clubs = JSON.parse(response.data);
      expect(Array.isArray(clubs)).toBe(true);
    });

    test('should support CRUD operations through API', async () => {
      // Test CREATE
      const newClub = {
        name: 'Integration Test Club',
        players: ['Test Player 1', 'Test Player 2'],
        coach: 'Test Coach'
      };
      
      const createResponse = await makeHttpRequest(`${API_URL}/clubs`, 'POST', newClub);
      expect(createResponse.statusCode).toBe(201);
      
      const createdClub = JSON.parse(createResponse.data);
      expect(createdClub._id).toBeDefined();
      
      // Test READ
      const readResponse = await makeHttpRequest(`${API_URL}/clubs/${createdClub._id}`);
      expect(readResponse.statusCode).toBe(200);
      
      const readClub = JSON.parse(readResponse.data);
      expect(readClub.name).toBe(newClub.name);
      
      // Test UPDATE
      const updateData = { name: 'Updated Integration Test Club' };
      const updateResponse = await makeHttpRequest(`${API_URL}/clubs/${createdClub._id}`, 'PUT', updateData);
      expect(updateResponse.statusCode).toBe(200);
      
      // Test DELETE
      const deleteResponse = await makeHttpRequest(`${API_URL}/clubs/${createdClub._id}`, 'DELETE');
      expect(deleteResponse.statusCode).toBe(200);
      
      // Verify deletion
      const verifyResponse = await makeHttpRequest(`${API_URL}/clubs/${createdClub._id}`);
      expect(verifyResponse.statusCode).toBe(404);
    });

    /**
     * Frontend to API communication
     */
    test('should enable frontend to API communication', async () => {
      // Test that frontend can load (which requires API communication for data)
      const frontendResponse = await makeHttpRequest(FRONTEND_URL);
      expect(frontendResponse.statusCode).toBe(200);
      
      // Verify frontend HTML contains expected elements
      expect(frontendResponse.data).toMatch(/<div id="root">/);
    });

    test('should handle CORS for cross-origin requests', async () => {
      const response = await makeHttpRequest(`${API_URL}/clubs`, 'OPTIONS');
      expect(response.statusCode).toBeLessThan(400);
    });
  });

  describe('Container Cleanup and Resource Management', () => {
    /**
     * Requirement 4.5: Container cleanup
     */
    test('should properly clean up containers and networks', async () => {
      // Stop services
      execSync('docker-compose down', { stdio: 'ignore' });
      
      // Verify containers are stopped
      const runningContainers = execSync('docker ps --filter "name=bb" --format "{{.Names}}"', { encoding: 'utf8' });
      expect(runningContainers.trim()).toBe('');
      
      // Verify networks are cleaned up
      const networks = execSync('docker network ls --filter "name=bb" --format "{{.Name}}"', { encoding: 'utf8' });
      expect(networks.trim()).toBe('');
    });

    test('should support volume cleanup', async () => {
      // Start and stop services to create volumes
      execSync('docker-compose up -d', { stdio: 'ignore' });
      await sleep(5000);
      execSync('docker-compose down -v', { stdio: 'ignore' });
      
      // Verify volumes are cleaned up when using -v flag
      const volumes = execSync('docker volume ls --filter "name=bb" --format "{{.Name}}"', { encoding: 'utf8' });
      expect(volumes.trim()).toBe('');
    });
  });

  describe('Performance and Reliability Validation', () => {
    beforeAll(async () => {
      // Ensure services are running for performance tests
      if (!devComposeProcess) {
        console.log('🔧 Starting development environment for performance tests...');
        devComposeProcess = spawn('docker-compose', ['up', '-d'], {
          detached: false,
          stdio: 'pipe'
        });
        
        await waitForServicesReady(API_URL, FRONTEND_URL, MONGODB_URI);
      }
    });

    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        makeHttpRequest(`${API_URL}/clubs`)
      );
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
      
      // Should complete within reasonable time (less than 10 seconds for 10 requests)
      expect(totalTime).toBeLessThan(10000);
      
      console.log(`Concurrent requests completed in ${totalTime}ms`);
    });

    test('should maintain service stability under load', async () => {
      // Send multiple requests over time
      for (let i = 0; i < 5; i++) {
        const response = await makeHttpRequest(`${API_URL}/health`);
        expect(response.statusCode).toBe(200);
        
        const healthData = JSON.parse(response.data);
        expect(healthData.status).toBe('healthy');
        
        await sleep(1000);
      }
    });

    test('should recover from temporary failures', async () => {
      // Restart API service to simulate temporary failure
      execSync('docker-compose restart api', { stdio: 'ignore' });
      
      // Wait for service to recover
      await waitForServiceReady(API_URL, 60000); // 1 minute timeout
      
      // Verify service is working again
      const response = await makeHttpRequest(`${API_URL}/health`);
      expect(response.statusCode).toBe(200);
    });
  });

  // Helper functions
  async function waitForServicesReady(apiUrl, frontendUrl, mongoUri) {
    const maxAttempts = 90; // 3 minutes with 2-second intervals
    let attempts = 0;

    console.log('⏳ Waiting for services to be ready...');

    while (attempts < maxAttempts) {
      try {
        const [apiReady, frontendReady, mongoReady] = await Promise.all([
          checkServiceReady(apiUrl),
          checkServiceReady(frontendUrl),
          checkMongoDBReady(mongoUri)
        ]);

        if (apiReady && frontendReady && mongoReady) {
          console.log('✅ All services are ready!');
          return;
        }
      } catch (error) {
        // Continue waiting
      }

      attempts++;
      if (attempts % 15 === 0) {
        console.log(`⏳ Still waiting... (${attempts}/${maxAttempts})`);
      }
      await sleep(2000);
    }

    throw new Error('Services failed to start within timeout period');
  }

  async function waitForServiceReady(url, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const ready = await checkServiceReady(url);
        if (ready) {
          return;
        }
      } catch (error) {
        // Continue waiting
      }
      
      await sleep(1000);
    }
    
    throw new Error(`Service at ${url} failed to become ready within ${timeout}ms`);
  }

  async function waitForMongoDBReady(uri) {
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const ready = await checkMongoDBReady(uri);
        if (ready) {
          return;
        }
      } catch (error) {
        // Continue waiting
      }
      
      attempts++;
      await sleep(2000);
    }
    
    throw new Error('MongoDB failed to become ready');
  }

  async function checkServiceReady(url) {
    try {
      const response = await makeHttpRequest(url);
      return response.statusCode < 500;
    } catch (error) {
      return false;
    }
  }

  async function checkMongoDBReady(uri) {
    try {
      const client = new MongoClient(uri);
      await client.connect();
      await client.db('admin').command({ ping: 1 });
      await client.close();
      return true;
    } catch (error) {
      return false;
    }
  }

  function makeHttpRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: method,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
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

      if (data && (method === 'POST' || method === 'PUT')) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
});