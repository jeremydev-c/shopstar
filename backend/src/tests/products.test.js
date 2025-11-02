// IMPORTANT: Require setup FIRST before any other imports
require('./setup');

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');

const { connectDB, disconnectDB, clearDatabase } = require('./dbHelper');

beforeAll(async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-test';
  await connectDB(mongoURI);
}, 15000);

afterAll(async () => {
  await disconnectDB();
}, 10000);

beforeEach(async () => {
  await clearDatabase();
});

describe('Product Routes', () => {
  let adminToken;
  let categoryId;

  beforeEach(async () => {
    // Create admin user
    const user = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin123456',
      role: 'admin'
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin123456'
      });

    adminToken = loginResponse.body.token;

    // Create a category
    const category = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic products'
    });
    categoryId = category._id;
  });

  describe('GET /api/products', () => {
    it('should get all products (public route)', async () => {
      // Create test products
      await Product.create([
        {
          name: 'Laptop',
          description: 'Gaming laptop',
          price: 999,
          sku: 'LAP-001',
          category: categoryId,
          images: ['https://example.com/laptop.jpg'],
          inventory: { quantity: 10 },
          status: 'active'
        },
        {
          name: 'Phone',
          description: 'Smartphone',
          price: 599,
          sku: 'PHN-001',
          category: categoryId,
          images: ['https://example.com/phone.jpg'],
          inventory: { quantity: 5 },
          status: 'active'
        }
      ]);

      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(2);
    });

    it('should filter products by category', async () => {
      // Create products in different categories
      const category2 = await Category.create({
        name: 'Clothing',
        slug: 'clothing'
      });

      await Product.create([
        {
          name: 'Laptop',
          description: 'Gaming laptop',
          price: 999,
          sku: 'LAP-001',
          category: categoryId,
          images: ['image.jpg'],
          inventory: { quantity: 10 },
          status: 'active'
        },
        {
          name: 'Shirt',
          description: 'Cotton shirt',
          price: 29,
          sku: 'SHT-001',
          category: category2._id,
          images: ['image.jpg'],
          inventory: { quantity: 50 },
          status: 'active'
        }
      ]);

      const response = await request(app)
        .get(`/api/products?category=${categoryId}`);

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBe(1);
      expect(response.body.products[0].name).toBe('Laptop');
    });
  });

  describe('POST /api/products', () => {
    it('should create product (admin only)', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Product',
          description: 'Product description',
          price: 99.99,
          sku: 'NEW-001',
          category: categoryId.toString(),
          images: ['https://example.com/image.jpg'],
          inventory: {
            quantity: 10,
            lowStockThreshold: 5
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.product.name).toBe('New Product');
      expect(response.body.product.price).toBe(99.99);
    });

    it('should reject product creation without admin token', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          name: 'New Product',
          description: 'Product description',
          price: 99.99,
          sku: 'NEW-001',
          category: categoryId.toString(),
          images: ['https://example.com/image.jpg']
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product (admin only)', async () => {
      const product = await Product.create({
        name: 'Original Product',
        description: 'Description',
        price: 50,
        sku: 'ORG-001',
        category: categoryId,
        images: ['image.jpg'],
        inventory: { quantity: 10 },
        status: 'active'
      });

      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 75
        });

      expect(response.status).toBe(200);
      expect(response.body.product.price).toBe(75);
    });

    it('should update inventory quantity', async () => {
      const product = await Product.create({
        name: 'Product',
        description: 'Description',
        price: 50,
        sku: 'PROD-001',
        category: categoryId,
        images: ['image.jpg'],
        inventory: { quantity: 10 },
        status: 'active'
      });

      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          inventory: {
            quantity: 50,
            lowStockThreshold: 10
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.product.inventory.quantity).toBe(50);
    });

    it('should reject update from non-admin', async () => {
      const product = await Product.create({
        name: 'Product',
        description: 'Product description',
        price: 50,
        sku: 'PROD-001',
        category: categoryId,
        images: ['image.jpg'],
        inventory: { quantity: 10 },
        status: 'active'
      });

      // Create customer user
      const customer = await User.create({
        name: 'Customer',
        email: 'customer@test.com',
        password: 'Customer123456'
      });

      const customerLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@test.com',
          password: 'Customer123456'
        });

      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${customerLogin.body.token}`)
        .send({
          price: 75
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product (admin only)', async () => {
      const product = await Product.create({
        name: 'Product to Delete',
        description: 'Description',
        price: 50,
        sku: 'DEL-001',
        category: categoryId,
        images: ['image.jpg'],
        inventory: { quantity: 10 },
        status: 'active'
      });

      const response = await request(app)
        .delete(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify soft delete (archived status)
      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct).toBeDefined();
      expect(deletedProduct.status).toBe('archived');
    });

    it('should reject deletion from non-admin', async () => {
      const product = await Product.create({
        name: 'Product',
        description: 'Product description',
        price: 50,
        sku: 'PROD-001',
        category: categoryId,
        images: ['image.jpg'],
        inventory: { quantity: 10 },
        status: 'active'
      });

      const customer = await User.create({
        name: 'Customer',
        email: 'customer2@test.com',
        password: 'Customer123456'
      });

      const customerLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer2@test.com',
          password: 'Customer123456'
        });

      const response = await request(app)
        .delete(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${customerLogin.body.token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get single product', async () => {
      const product = await Product.create({
        name: 'Single Product',
        description: 'Description',
        price: 99.99,
        sku: 'SINGLE-001',
        category: categoryId,
        images: ['image.jpg'],
        inventory: { quantity: 10 },
        status: 'active'
      });

      const response = await request(app)
        .get(`/api/products/${product._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.product.name).toBe('Single Product');
      expect(response.body.product.price).toBe(99.99);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/products/${fakeId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Product Search and Filtering', () => {
    beforeEach(async () => {
      // Create multiple products for testing
      await Product.create([
        {
          name: 'Laptop Computer',
          description: 'High-performance laptop',
          price: 999.99,
          sku: 'LAP-001',
          category: categoryId,
          images: ['laptop.jpg'],
          inventory: { quantity: 10 },
          status: 'active'
        },
        {
          name: 'Gaming Mouse',
          description: 'RGB gaming mouse',
          price: 49.99,
          sku: 'MOUSE-001',
          category: categoryId,
          images: ['mouse.jpg'],
          inventory: { quantity: 50 },
          status: 'active'
        },
        {
          name: 'Mechanical Keyboard',
          description: 'RGB mechanical keyboard',
          price: 129.99,
          sku: 'KEYBOARD-001',
          category: categoryId,
          images: ['keyboard.jpg'],
          inventory: { quantity: 30 },
          status: 'active'
        }
      ]);
    });

    it('should search products by name', async () => {
      const response = await request(app)
        .get('/api/products?search=laptop');

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeGreaterThan(0);
      expect(response.body.products[0].name.toLowerCase()).toContain('laptop');
    });

    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/products?minPrice=50&maxPrice=150');

      expect(response.status).toBe(200);
      response.body.products.forEach(product => {
        expect(product.price).toBeGreaterThanOrEqual(50);
        expect(product.price).toBeLessThanOrEqual(150);
      });
    });
  });
});

