const mongoose = require('mongoose');

/**
 * Connect to MongoDB for tests
 * @param {string} mongoURI - MongoDB connection string
 * @param {number} timeout - Timeout in milliseconds
 */
const connectDB = async (mongoURI, timeout = 10000) => {
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Replace database name with test database if connection string has a database
  let testURI = mongoURI;
  
  // Handle different database name patterns
  if (mongoURI.includes('/fashion-fit')) {
    // Replace fashion-fit with ecommerce-test
    testURI = mongoURI.replace('/fashion-fit', '/ecommerce-test');
  } else if (mongoURI.includes('/ecommerce')) {
    // Replace /ecommerce with /ecommerce-test (keep query params)
    testURI = mongoURI.replace('/ecommerce', '/ecommerce-test');
  } else if (!mongoURI.includes('/ecommerce-test')) {
    // Add test database name if none specified
    if (mongoURI.includes('?')) {
      // Connection string has query params, insert database name before ?
      testURI = mongoURI.replace('?', '/ecommerce-test?');
    } else if (!mongoURI.includes('/')) {
      // No database specified at all, append it
      testURI = mongoURI + '/ecommerce-test';
    } else {
      // Connection string ends with /, append test database
      testURI = mongoURI.replace(/\/$/, '') + '/ecommerce-test';
    }
  }

  // Try to connect with timeout
  try {
    await mongoose.connect(testURI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout for Atlas
      socketTimeoutMS: 45000,
    });
    console.log(`✅ Connected to test database`);
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!');
    console.error('Please check:');
    console.error('  1. Your MongoDB Atlas connection string in .env');
    console.error('  2. Your IP is whitelisted in Atlas (Network Access)');
    console.error('  3. Your username/password are correct');
    console.error(`  Connection string used: ${testURI.substring(0, 50)}...\n`);
    throw new Error(`Failed to connect to MongoDB: ${error.message}`);
  }
};

/**
 * Disconnect from MongoDB and cleanup
 */
const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Try to drop database (not available on MongoDB Atlas free tier)
      try {
        await mongoose.connection.dropDatabase();
      } catch (dropError) {
        // MongoDB Atlas doesn't allow dropDatabase - this is expected
        // Database will be cleaned by clearDatabase() between tests anyway
        if (!dropError.message.includes('not allowed')) {
          // Only log if it's not a permissions error (unexpected error)
          console.warn('⚠️  Could not drop test database:', dropError.message);
        }
      }
      await mongoose.connection.close();
      console.log('✅ Test database disconnected');
    }
  } catch (error) {
    // Ignore cleanup errors
    console.warn('Warning: Error during database cleanup:', error.message);
  }
};

/**
 * Clear all collections (but keep connection)
 */
const clearDatabase = async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    console.warn('Warning: Error clearing database:', error.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  clearDatabase
};

