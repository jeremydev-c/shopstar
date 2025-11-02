/**
 * Seed Products Script
 * 
 * This script creates sample products and categories for ShopStar
 * Run with: node src/scripts/seedProducts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Load models
const Category = require(path.join(__dirname, '../src/models/Category'));
const Product = require(path.join(__dirname, '../src/models/Product'));

const categories = [
  { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets', isActive: true },
  { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel', isActive: true },
  { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Home essentials and kitchenware', isActive: true },
  { name: 'Books', slug: 'books', description: 'Books and literature', isActive: true },
  { name: 'Sports', slug: 'sports', description: 'Sports equipment and accessories', isActive: true }
];

const products = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'Premium wireless headphones with noise cancellation. Perfect for music lovers and professionals.',
    price: 199.99,
    compareAtPrice: 249.99,
    sku: 'ELEC-HEAD-001',
    categorySlug: 'electronics',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500'
    ],
    inventory: { quantity: 50, lowStockThreshold: 10 },
    status: 'active',
    featured: true,
    tags: ['wireless', 'bluetooth', 'audio', 'headphones']
  },
  {
    name: 'Smart Watch Pro',
    description: 'Advanced smartwatch with fitness tracking, heart rate monitor, and smartphone integration.',
    price: 299.99,
    compareAtPrice: 349.99,
    sku: 'ELEC-WATCH-001',
    categorySlug: 'electronics',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'
    ],
    inventory: { quantity: 30, lowStockThreshold: 10 },
    status: 'active',
    featured: true,
    tags: ['smartwatch', 'fitness', 'wearable']
  },
  {
    name: 'Classic T-Shirt',
    description: 'Comfortable 100% cotton t-shirt. Available in multiple colors. Perfect for everyday wear.',
    price: 24.99,
    compareAtPrice: 29.99,
    sku: 'CLOTH-TSHIRT-001',
    categorySlug: 'clothing',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'
    ],
    inventory: { quantity: 100, lowStockThreshold: 20 },
    status: 'active',
    featured: false,
    tags: ['tshirt', 'cotton', 'casual']
  },
  {
    name: 'Leather Jacket',
    description: 'Genuine leather jacket. Stylish and durable. Perfect for autumn and winter seasons.',
    price: 299.99,
    compareAtPrice: 399.99,
    sku: 'CLOTH-JACKET-001',
    categorySlug: 'clothing',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500'
    ],
    inventory: { quantity: 25, lowStockThreshold: 5 },
    status: 'active',
    featured: true,
    tags: ['jacket', 'leather', 'outerwear']
  },
  {
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer. Makes up to 12 cups. Perfect for your morning routine.',
    price: 79.99,
    compareAtPrice: 99.99,
    sku: 'HOME-COFFEE-001',
    categorySlug: 'home-kitchen',
    images: [
      'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=500'
    ],
    inventory: { quantity: 40, lowStockThreshold: 10 },
    status: 'active',
    featured: false,
    tags: ['coffee', 'kitchen', 'appliance']
  },
  {
    name: 'The Great Gatsby',
    description: 'Classic novel by F. Scott Fitzgerald. A timeless tale of love, wealth, and the American Dream.',
    price: 12.99,
    compareAtPrice: 15.99,
    sku: 'BOOK-GATSBY-001',
    categorySlug: 'books',
    images: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500'
    ],
    inventory: { quantity: 200, lowStockThreshold: 50 },
    status: 'active',
    featured: false,
    tags: ['fiction', 'classic', 'literature']
  },
  {
    name: 'Yoga Mat',
    description: 'Non-slip yoga mat with carrying strap. Perfect for yoga, pilates, and exercise routines.',
    price: 29.99,
    compareAtPrice: 39.99,
    sku: 'SPORT-YOGA-001',
    categorySlug: 'sports',
    images: [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500'
    ],
    inventory: { quantity: 60, lowStockThreshold: 15 },
    status: 'active',
    featured: false,
    tags: ['yoga', 'fitness', 'exercise']
  },
  {
    name: 'Running Shoes',
    description: 'Lightweight running shoes with cushioned sole. Perfect for jogging and daily workouts.',
    price: 89.99,
    compareAtPrice: 119.99,
    sku: 'SPORT-SHOES-001',
    categorySlug: 'sports',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'
    ],
    inventory: { quantity: 45, lowStockThreshold: 10 },
    status: 'active',
    featured: true,
    tags: ['shoes', 'running', 'fitness']
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing)
    console.log('🗑️  Clearing existing categories and products...');
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Create categories
    console.log('📁 Creating categories...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Create category map for products
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });

    // Create products with category IDs
    console.log('📦 Creating products...');
    const productsWithCategories = products.map(product => ({
      ...product,
      category: categoryMap[product.categorySlug],
      categorySlug: undefined // Remove slug from product data
    }));

    const createdProducts = await Product.insertMany(productsWithCategories);
    console.log(`✅ Created ${createdProducts.length} products`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Categories: ${createdCategories.length}`);
    console.log(`   Products: ${createdProducts.length}`);
    console.log('\n✨ You can now browse products in your ShopStar store!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();

