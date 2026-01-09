module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000, // 60 seconds for Docker operations
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testMatch: [
    '<rootDir>/test/**/*.test.js',
    '<rootDir>/test/**/*.integration.test.js'
  ],
  collectCoverageFrom: [
    'server.js',
    'models.js',
    '!node_modules/**'
  ],
  verbose: true
};