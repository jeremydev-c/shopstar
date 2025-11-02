/**
 * Make User Admin Script
 * 
 * This script sets a user's role to 'admin' by email
 * Run with: node scripts/makeAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const User = require(path.join(__dirname, '../src/models/User'));

async function makeAdmin() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const email = 'nduatijeremy7@gmail.com';

    // Find and update user
    const user = await User.findOneAndUpdate(
      { email: email },
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      console.log(`❌ User with email ${email} not found.`);
      console.log('Please make sure you have registered an account with this email.');
      process.exit(1);
    }

    console.log(`✅ Success! ${user.name} (${user.email}) is now an admin!`);
    console.log('\nYou can now:');
    console.log('  - Access the admin panel at /admin/products');
    console.log('  - Manage products, categories, and orders');
    console.log('  - View all admin features');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

makeAdmin();

