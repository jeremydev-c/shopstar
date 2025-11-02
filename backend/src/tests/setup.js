// Test setup file - runs before all tests
// IMPORTANT: This must be required FIRST before any other imports
// Set test environment variables BEFORE any code runs

// Load .env file FIRST to get MongoDB URI and other environment variables
require('dotenv').config();

// Set test environment variables FIRST
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_testing_only';
// Use MONGODB_URI from .env if available, otherwise fallback to localhost
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-test';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Suppress console logs during tests (optional - remove if you want to see logs)
const originalConsoleError = console.error;
console.error = (...args) => {
  // Suppress MongoDB connection errors during test setup
  if (args[0]?.includes?.('Database connection error')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

module.exports = {};

