/**
 * Docker Configuration Validation Tests
 * Feature: docker-support, Task 10: Final integration testing and validation
 * 
 * This test suite validates Docker configurations and requirements without
 * requiring full container startup, focusing on configuration validation
 * and quick integration checks.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Docker Configuration Validation', () => {
  
  describe('Development Environment Configuration', () => {
    /**
     * Requirement 1.1: Docker Compose configuration
     */
    test('should have valid docker-compose.yml configuration', () => {
      expect(fs.existsSync('./docker-compose.yml')).toBe(true);
      
      const composeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
      
      // Verify required services are defined
      expect(composeContent).toMatch(/services:/);
      expect(composeContent).toMatch(/api:/);
      expect(composeContent).toMatch(/frontend:/);
      expect(composeContent).toMatch(/mongodb:/);
      
      // Verify networks and volumes
      expect(composeContent).toMatch(/networks:/);
      expect(composeContent).toMatch(/volumes:/);
    });

    /**
     * Requirements 1.2, 1.3: Port configuration
     */
    test('should configure correct ports for services', () => {
      const composeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
      
      // API should be on port 3000 (with environment variable support)
      expect(composeContent).toMatch(/\$\{PORT:-3000\}:\$\{PORT:-3000\}/);
      
      // Frontend should be on port 3001 (with environment variable support)
      expect(composeContent).toMatch(/\$\{FRONTEND_PORT:-3001\}:\$\{FRONTEND_PORT:-3001\}/);
      
      // MongoDB should be on port 27017 (with environment variable support)
      expect(composeContent).toMatch(/\$\{MONGODB_PORT:-27017\}:27017/);
    });

    /**
     * Requirement 1.4: Service dependencies
     */
    test('should configure proper service dependencies', () => {
      const composeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
      
      // API should depend on MongoDB
      expect(composeContent).toMatch(/depends_on:[\s\S]*mongodb:/);
      
      // Frontend should depend on API
      expect(composeContent).toMatch(/depends_on:[\s\S]*api:/);
    });

    /**
     * Requirement 1.5: Volume mounting for hot reload
     */
    test('should configure volume mounts for hot reload', () => {
      const composeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
      
      // API volume mounts
      expect(composeContent).toMatch(/\.\/server\.js:\/app\/server\.js/);
      expect(composeContent).toMatch(/\.\/models\.js:\/app\/models\.js/);
      
      // Frontend volume mounts
      expect(composeContent).toMatch(/\.\/src:\/app\/src/);
      expect(composeContent).toMatch(/\.\/vite\.config\.ts:\/app\/vite\.config\.ts/);
    });
  });

  describe('Production Environment Configuration', () => {
    /**
     * Requirements 3.1, 3.3: Multi-stage builds
     */
    test('should have production Dockerfiles with multi-stage builds', () => {
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
     * Requirement 3.2: Production compose configuration
     */
    test('should have production docker-compose configuration', () => {
      expect(fs.existsSync('./docker-compose.prod.yml')).toBe(true);
      
      const prodComposeContent = fs.readFileSync('./docker-compose.prod.yml', 'utf8');
      
      // Should use production Dockerfiles
      expect(prodComposeContent).toMatch(/dockerfile: Dockerfile\.prod\.api/);
      expect(prodComposeContent).toMatch(/dockerfile: Dockerfile\.prod\.frontend/);
      
      // Should have scaling configuration
      expect(prodComposeContent).toMatch(/replicas:/);
      expect(prodComposeContent).toMatch(/resources:/);
    });

    /**
     * Requirement 3.4: Health checks
     */
    test('should configure health checks for all services', () => {
      const devComposeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
      const prodComposeContent = fs.readFileSync('./docker-compose.prod.yml', 'utf8');
      
      // Development health checks
      expect(devComposeContent).toMatch(/healthcheck:/);
      expect(devComposeContent).toMatch(/test:.*health/);
      
      // Production health checks
      expect(prodComposeContent).toMatch(/healthcheck:/);
      expect(prodComposeContent).toMatch(/test:.*health/);
    });
  });

  describe('Database Configuration', () => {
    /**
     * Requirements 2.1, 2.2: Database initialization
     */
    test('should configure database initialization', () => {
      const composeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
      
      // Should have database name environment variable
      expect(composeContent).toMatch(/MONGO_INITDB_DATABASE/);
      
      // Should have initialization script volume mount
      expect(composeContent).toMatch(/mongo-init.*docker-entrypoint-initdb\.d/);
    });

    /**
     * Requirement 2.3: Data persistence
     */
    test('should configure persistent volumes for database', () => {
      const composeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
      
      // Should have named volume for MongoDB data
      expect(composeContent).toMatch(/mongodb_data:\/data\/db/);
      
      // Should define the volume
      expect(composeContent).toMatch(/volumes:[\s\S]*mongodb_data:/);
    });

    /**
     * Requirement 2.4: Database connectivity
     */
    test('should configure proper database connection strings', () => {
      const devComposeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
      const prodComposeContent = fs.readFileSync('./docker-compose.prod.yml', 'utf8');
      
      // Development should use 'mongodb' service name
      expect(devComposeContent).toMatch(/mongodb:\/\/mongodb:/);
      
      // Production should use 'mongo' service name
      expect(prodComposeContent).toMatch(/mongodb:\/\/mongo:/);
    });
  });

  describe('Environment Configuration', () => {
    /**
     * Requirements 3.5, 5.1: Environment variables
     */
    test('should have comprehensive environment configuration', () => {
      expect(fs.existsSync('.env.example')).toBe(true);
      
      const envExample = fs.readFileSync('.env.example', 'utf8');
      
      const requiredVars = [
        'NODE_ENV',
        'MONGODB_URI',
        'PORT',
        'FRONTEND_PORT',
        'VITE_API_URL',
        'DATABASE_NAME',
        'SESSION_SECRET',
        'JWT_SECRET'
      ];
      
      requiredVars.forEach(varName => {
        expect(envExample).toMatch(new RegExp(`${varName}=`));
      });
    });

    /**
     * Requirement 5.4: Secrets management
     */
    test('should not contain hardcoded secrets in configuration files', () => {
      const configFiles = [
        './docker-compose.yml',
        './docker-compose.prod.yml',
        './Dockerfile.prod.api',
        './Dockerfile.prod.frontend'
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

  describe('Development Workflow Support', () => {
    /**
     * Requirement 4.1: Source code mounting
     */
    test('should mount source code for live development', () => {
      const composeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
      
      // API source files should be mounted
      const apiMounts = [
        './server.js:/app/server.js',
        './models.js:/app/models.js',
        './seed.js:/app/seed.js'
      ];
      
      apiMounts.forEach(mount => {
        expect(composeContent).toMatch(new RegExp(mount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      });
      
      // Frontend source files should be mounted
      const frontendMounts = [
        './src:/app/src',
        './index.html:/app/index.html',
        './vite.config.ts:/app/vite.config.ts'
      ];
      
      frontendMounts.forEach(mount => {
        expect(composeContent).toMatch(new RegExp(mount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      });
    });

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

  describe('Network and Service Communication', () => {
    /**
     * Requirements 5.3, 5.5: Network configuration
     */
    test('should configure proper networking', () => {
      const devComposeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
      const prodComposeContent = fs.readFileSync('./docker-compose.prod.yml', 'utf8');
      
      // Development networking
      expect(devComposeContent).toMatch(/networks:[\s\S]*bb-network/);
      expect(devComposeContent).toMatch(/driver: bridge/);
      
      // Production networking
      expect(prodComposeContent).toMatch(/networks:[\s\S]*basketball-network/);
      expect(prodComposeContent).toMatch(/driver:/);
    });

    test('should configure CORS for cross-origin requests', () => {
      const composeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
      
      // Should have CORS_ORIGINS environment variable
      expect(composeContent).toMatch(/CORS_ORIGINS/);
    });
  });

  describe('Docker Compose Validation', () => {
    test('should have valid docker-compose syntax', () => {
      // Test development compose file
      expect(() => {
        execSync('docker-compose -f docker-compose.yml config', { stdio: 'pipe' });
      }).not.toThrow();
      
      // Test production compose file
      expect(() => {
        execSync('docker-compose -f docker-compose.prod.yml config', { stdio: 'pipe' });
      }).not.toThrow();
    });

    test('should validate Dockerfile syntax', () => {
      const dockerfiles = [
        './Dockerfile.dev.api',
        './Dockerfile.dev.frontend',
        './Dockerfile.prod.api',
        './Dockerfile.prod.frontend'
      ];
      
      dockerfiles.forEach(dockerfile => {
        if (fs.existsSync(dockerfile)) {
          const content = fs.readFileSync(dockerfile, 'utf8');
          
          // Should have FROM instruction
          expect(content).toMatch(/^FROM /m);
          
          // Should have WORKDIR
          expect(content).toMatch(/WORKDIR/);
          
          // Production Dockerfiles should have EXPOSE
          if (dockerfile.includes('prod')) {
            expect(content).toMatch(/EXPOSE/);
          }
        }
      });
    });
  });
});