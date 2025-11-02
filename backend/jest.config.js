module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/src/tests/setup.js'],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/config/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  forceExit: true,
  detectOpenHandles: true,
  // Global test setup timeout
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  // Increase timeout for slow database operations
  globalSetup: undefined,
  globalTeardown: undefined
};

