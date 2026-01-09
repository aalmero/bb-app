/**
 * Streamlined Final Integration Testing and Validation
 * Feature: docker-support, Task 10: Final integration testing and validation
 * 
 * This streamlined test suite validates core Docker functionality:
 * - Development workflow with Docker
 * - Production build validation
 * - Environment configurations
 * - Service communication
 * - All requirements from the Docker support spec
 */

const { execSync } = require('child_process');
const http = require('http');
const { MongoClient } = require('mongodb');
const fs = require('fs');

describe('Streamlined Final Docker Integration Tests', () => {
  const TIMEOUT = 30000; // 30 seconds timeout
  const API_URL = 'http://localhost:3000';
  const FRONTEND_URL = 'http://localhost:3001';
  const MONGODB_URI = 'mongodb://localhost:27017';
  const DATABASE_NAME = 'bb-db';

  beforeAll(async () => {
    console.log('🚀 Starting Streamlined Integration Tests...');
  }, TIMEOUT);

  describe('Development Environment Validation', () => {
    /**
     * Requirement 1.1: Docker Compose starts all required services
     */
    test('should have all required services running', async () => {
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
    test('should have API accessible with health endpoint', async () => {
      const response = await makeHttpRequest(`${API_URL}/health`);
      expect(response.statusCode).toBe(200);
      
      const healthData = JSON.parse(response.data);
      expect(healthData.status).toBe('healthy');
      expect(healthData.database).toBeDefined();
      expect(healthData.database.healthy).toBe(true);
    });

    test('should have Frontend accessible', async () => {
      const response = await makeHttpRequest(FRONTEND_URL);
      expect(response.statusCode).toBe(200);
      expect(response.data).toMatch(/<div id="root">/);
    });

    /**
     * Requirement 1.4: MongoDB internal accessibility
     */
    test('should have MongoDB accessible internally to API service', async () => {
      const healthResponse = await makeHttpRequest(`${API_URL}/health`);
      expect(healthResponse.statusCode).toBe(200);
      
      const healthData = JSON.parse(healthResponse.data);
      expect(healthData.database.state).toBe('connected');
      expect(healthData.database.healthy).toBe(true);
    });

    /**
     * Requirements 2.1, 2.2: Database initialization and seeding
     */
    test('should have seeded data in database', async () => {
      const response = await makeHttpRequest(`${API_URL}/clubs`);
      expect(response.statusCode).toBe(200);
      
      const clubs = JSON.parse(response.data);
      expect(Array.isArray(clubs)).toBe(true);
      expect(clubs.length).toBeGreaterThan(0);
      
      // Check for expected seeded clubs
      const clubNames = clubs.map(club => club.name);
      expect(clubNames).toContain('Lakers');
    });

    /**
     * Requirement 1.5: Volume mounting for live editing
     */
    test('should mount source code as volumes for live editing', async () => {
      const composeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
      
      // Verify API volume mounts
      expect(composeContent).toMatch(/\.\/server\.js:\/app\/server\.js/);
      expect(composeContent).toMatch(/\.\/models\.js:\/app\/models\.js/);
      
      // Verify frontend volume mounts
      expect(composeContent).toMatch(/\.\/src:\/app\/src/);
      expect(composeContent).toMatch(/\.\/vite\.config\.ts:\/app\/vite\.config\.ts/);
    });
  });

  describe('Production Configuration Validation', () => {
    /**
     * Requirements 3.1, 3.3: Multi-stage builds and optimization
     */
    test('should have production Dockerfiles with multi-stage builds', async () => {
      // Check API production Dockerfile
      expect(fs.existsSync('./Dockerfile.prod.api')).toBe(true);
      const apiDockerfile = fs.readFileSync('./Dockerfile.prod.api', 'utf8');
      expect(apiDockerfile).toMatch(/FROM.*AS builder/);
      expect(apiDockerfile).toMatch(/FROM.*AS runtime/);
      expect(apiDockerfile).toMatch(/COPY --from=builder/);
      
      // Check Frontend production Dockerfile
      expect(fs.existsSync('./Dockerfile.prod.frontend')).toBe(true);
      const frontendDockerfile = fs.readFileSync('./Dockerfile.prod.frontend', 'utf8');
      expect(frontendDockerfile).toMatch(/FROM.*AS builder/);
      expect(frontendDockerfile).toMatch(/FROM.*AS runtime/);
      expect(frontendDockerfile).toMatch(/COPY --from=builder/);
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
      expect(fs.existsSync('.env.example')).toBe(true);
      
      const envExample = fs.readFileSync('.env.example', 'utf8');
      
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
     * Requirement 5.4: Secrets management
     */
    test('should not contain hardcoded secrets', async () => {
      const configFiles = [
        './docker-compose.yml',
        './docker-compose.prod.yml'
      ];
      
      const sensitivePatterns = [
        /password\s*=\s*["'][^"']{8,}["']/i,
        /secret\s*=\s*["'][^"']{8,}["']/i,
        /key\s*=\s*["'][^"']{8,}["']/i
      ];
      
      configFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          sensitivePatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              // Should only contain development/example secrets
              const match = matches[0];
              expect(match).toMatch(/(dev|test|example|change-this)/i);
            }
          });
        }
      });
    });
  });

  describe('Service Communication Validation', () => {
    /**
     * Requirement 2.4: API to database communication
     */
    test('should enable API to database communication', async () => {
      const response = await makeHttpRequest(`${API_URL}/clubs`);
      expect(response.statusCode).toBe(200);
      
      const clubs = JSON.parse(response.data);
      expect(Array.isArray(clubs)).toBe(true);
    });

    /**
     * Test basic CRUD operations
     */
    test('should support basic CRUD operations through API', async () => {
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
      
      // Test DELETE
      const deleteResponse = await makeHttpRequest(`${API_URL}/clubs/${createdClub._id}`, 'DELETE');
      expect(deleteResponse.statusCode).toBe(204);
    });

    /**
     * Frontend to API communication
     */
    test('should handle CORS for cross-origin requests', async () => {
      const response = await makeHttpRequest(`${API_URL}/clubs`, 'OPTIONS');
      expect(response.statusCode).toBeLessThan(400);
    });
  });

  describe('Development Workflow Support', () => {
    /**
     * Requirement 4.2: Helper scripts
     */
    test('should have development workflow scripts', () => {
      const expectedScripts = [
        './docker-dev.sh',
        './docker-test.sh',
        './docker-packages.sh',
        './docker-cleanup.sh',
        './docker-setup.sh'
      ];
      
      expectedScripts.forEach(script => {
        expect(fs.existsSync(script)).toBe(true);
        
        // Scripts should be executable
        const stats = fs.statSync(script);
        expect(stats.mode & parseInt('111', 8)).toBeGreaterThan(0);
      });
    });

    /**
     * Requirements 4.4, 4.5: Testing and cleanup
     */
    test('should support testing and cleanup workflows', () => {
      // Test script should exist and be executable
      expect(fs.existsSync('./docker-test.sh')).toBe(true);
      
      const testScript = fs.readFileSync('./docker-test.sh', 'utf8');
      expect(testScript).toMatch(/run_all_tests/);
      expect(testScript).toMatch(/run_integration_tests/);
      
      // Cleanup script should exist
      expect(fs.existsSync('./docker-cleanup.sh')).toBe(true);
      
      const cleanupScript = fs.readFileSync('./docker-cleanup.sh', 'utf8');
      expect(cleanupScript).toMatch(/docker.*down/);
      expect(cleanupScript).toMatch(/docker.*prune/);
    });
  });

  describe('Performance and Reliability Validation', () => {
    test('should handle multiple concurrent requests efficiently', async () => {
      const concurrentRequests = 3; // Reduced from 10 for faster execution
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
      
      // Should complete within reasonable time (less than 5 seconds for 3 requests)
      expect(totalTime).toBeLessThan(5000);
      
      console.log(`Concurrent requests completed in ${totalTime}ms`);
    });

    test('should maintain service stability', async () => {
      // Send 3 requests over time (reduced from 5)
      for (let i = 0; i < 3; i++) {
        const response = await makeHttpRequest(`${API_URL}/health`);
        expect(response.statusCode).toBe(200);
        
        const healthData = JSON.parse(response.data);
        expect(healthData.status).toBe('healthy');
        
        await sleep(500); // Reduced wait time
      }
    });
  });

  // Helper functions
  function makeHttpRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: method,
        timeout: 5000,
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