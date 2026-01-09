// Test setup file for Jest
// This file runs before each test suite

// Increase timeout for Docker operations
jest.setTimeout(60000);

// Global test utilities
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Cleanup function for tests
global.cleanup = async () => {
  // Add any global cleanup logic here
};