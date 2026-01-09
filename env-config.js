/**
 * Environment Configuration Manager
 * 
 * This module handles loading and validating environment variables
 * with support for different environments and secure secrets management.
 */

const fs = require('fs');
const path = require('path');

/**
 * Load environment configuration based on NODE_ENV
 * Supports environment-specific .env files and validation
 */
class EnvironmentConfig {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.requiredVars = new Set();
    this.secretVars = new Set(['SESSION_SECRET', 'JWT_SECRET', 'MONGODB_URI']);
    this.config = {};
    
    this.loadEnvironmentFiles();
    this.validateConfiguration();
  }

  /**
   * Load environment files in order of precedence:
   * 1. .env.local (highest priority, never committed)
   * 2. .env.[environment] (environment-specific)
   * 3. .env (default fallback)
   * 4. Process environment variables (override everything)
   */
  loadEnvironmentFiles() {
    const envFiles = [
      '.env',
      `.env.${this.environment}`,
      '.env.local'
    ];

    // Load each env file if it exists
    envFiles.forEach(file => {
      const filePath = path.resolve(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.loadEnvFile(filePath);
        console.log(`[ENV] Loaded configuration from ${file}`);
      }
    });

    // Process environment variables always take precedence
    this.config = { ...this.config, ...process.env };
  }

  /**
   * Parse and load a single .env file
   */
  loadEnvFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Skip empty lines and comments
        line = line.trim();
        if (!line || line.startsWith('#')) return;

        // Parse key=value pairs
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          const cleanKey = key.trim();
          let cleanValue = value.trim();

          // Remove quotes if present
          if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
              (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
            cleanValue = cleanValue.slice(1, -1);
          }

          // Only set if not already defined (precedence)
          if (!this.config.hasOwnProperty(cleanKey)) {
            this.config[cleanKey] = cleanValue;
          }
        } else {
          console.warn(`[ENV] Invalid line in ${filePath}:${index + 1}: ${line}`);
        }
      });
    } catch (error) {
      console.error(`[ENV] Error loading ${filePath}:`, error.message);
    }
  }

  /**
   * Add required environment variables
   */
  require(...vars) {
    vars.forEach(v => this.requiredVars.add(v));
    return this;
  }

  /**
   * Mark variables as secrets (for validation and logging)
   */
  secrets(...vars) {
    vars.forEach(v => this.secretVars.add(v));
    return this;
  }

  /**
   * Get environment variable with optional default
   */
  get(key, defaultValue = undefined) {
    const value = this.config[key];
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Get environment variable as integer
   */
  getInt(key, defaultValue = undefined) {
    const value = this.get(key, defaultValue);
    return value !== undefined ? parseInt(value, 10) : undefined;
  }

  /**
   * Get environment variable as boolean
   */
  getBool(key, defaultValue = undefined) {
    const value = this.get(key, defaultValue);
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Get environment variable as array (comma-separated)
   */
  getArray(key, defaultValue = []) {
    const value = this.get(key);
    if (!value) return defaultValue;
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }

  /**
   * Validate configuration and check for required variables
   */
  validateConfiguration() {
    const missing = [];
    const insecure = [];

    // Check required variables
    this.requiredVars.forEach(key => {
      if (!this.config[key]) {
        missing.push(key);
      }
    });

    // Check for insecure secrets in production
    if (this.environment === 'production') {
      this.secretVars.forEach(key => {
        const value = this.config[key];
        if (value && this.isInsecureSecret(key, value)) {
          insecure.push(key);
        }
      });
    }

    // Report validation errors
    if (missing.length > 0) {
      console.error(`[ENV] Missing required environment variables: ${missing.join(', ')}`);
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (insecure.length > 0) {
      console.error(`[ENV] Insecure secrets detected in production: ${insecure.join(', ')}`);
      throw new Error(`Insecure secrets detected in production: ${insecure.join(', ')}`);
    }

    console.log(`[ENV] Configuration validated for ${this.environment} environment`);
  }

  /**
   * Check if a secret value is insecure (default/placeholder values)
   */
  isInsecureSecret(key, value) {
    const insecurePatterns = [
      /^(dev|development|test|staging|demo)/i,
      /^(your-|change-this|replace-with|example)/i,
      /^(secret|password|key)$/i,
      /^(123|abc|test)/i
    ];

    return insecurePatterns.some(pattern => pattern.test(value)) || value.length < 16;
  }

  /**
   * Get sanitized configuration for logging (secrets masked)
   */
  getSanitizedConfig() {
    const sanitized = { ...this.config };
    
    this.secretVars.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '***MASKED***';
      }
    });

    return sanitized;
  }

  /**
   * Log configuration summary (with secrets masked)
   */
  logConfiguration() {
    console.log(`[ENV] Environment: ${this.environment}`);
    console.log(`[ENV] Configuration loaded with ${Object.keys(this.config).length} variables`);
    
    if (process.env.LOG_LEVEL === 'debug') {
      console.log('[ENV] Configuration:', JSON.stringify(this.getSanitizedConfig(), null, 2));
    }
  }
}

// Create and export singleton instance
const envConfig = new EnvironmentConfig();

// Define required variables for the application
envConfig
  .require('NODE_ENV', 'PORT', 'MONGODB_URI')
  .secrets('SESSION_SECRET', 'JWT_SECRET', 'MONGODB_URI');

// Log configuration if not in test environment
if (process.env.NODE_ENV !== 'test') {
  envConfig.logConfiguration();
}

module.exports = envConfig;