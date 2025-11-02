// IMPORTANT: Require setup FIRST before any other imports
require('./setup');

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Cart = require('../models/Cart');
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

describe('Cart Routes', () => {
  let token;
  let userId;
  let productId;
  let categoryId;

  beforeEach(async () => {
    // Create user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456'
      });

    token = registerResponse.body.token;
    userId = registerResponse.body.user.id;

    // Create category
    const category = await Category.create({
      name: 'Test Category',
      slug: 'test-category'
    });
    categoryId = category._id;

    // Create product
    const product = await Product.create({
      name: 'Test Product',
      description: 'Test description',
      price: 29.99,
      sku: 'TEST-001',
      category: categoryId,
      images: ['https://example.com/image.jpg'],
      inventory: { quantity: 100 },
      status: 'active'
    });
    productId = product._id;
  });

  describe('GET /api/cart', () => {
    it('should get empty cart for new user', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.cart.items.length).toBe(0);
      expect(response.body.cart.total).toBe(0);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/cart');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/cart', () => {
    it('should add item to cart', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: productId.toString(),
          quantity: 2
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cart.items.length).toBe(1);
      expect(response.body.cart.items[0].quantity).toBe(2);
    });

    it('should reject adding out of stock item', async () => {
      // Update product to have 0 inventory
      await Product.findByIdAndUpdate(productId, {
        'inventory.quantity': 0
      });

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: productId.toString(),
          quantity: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('available');
    });
  });

  describe('PUT /api/cart/:itemId', () => {
    it('should update cart item quantity', async () => {
      // Add item first
      const addResponse = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: productId.toString(),
          quantity: 1
        });

      const itemId = addResponse.body.cart.items[0]._id;

      // Update quantity
      const response = await request(app)
        .put(`/api/cart/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          quantity: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.cart.items[0].quantity).toBe(5);
    });
  });

  describe('DELETE /api/cart/:itemId', () => {
    it('should remove item from cart', async () => {
      // Add item first
      const addResponse = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: productId.toString(),
          quantity: 1
        });

      const itemId = addResponse.body.cart.items[0]._id;

      // Remove item
      const response = await request(app)
        .delete(`/api/cart/${itemId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.cart.items.length).toBe(0);
    });
  });

  describe('DELETE /api/cart', () => {
    it('should clear entire cart', async () => {
      // Add multiple items
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: productId.toString(),
          quantity: 2
        });

      // Create another product and add to cart
      const product2 = await Product.create({
        name: 'Product 2',
        description: 'Description',
        price: 39.99,
        sku: 'TEST-002',
        category: categoryId,
        images: ['image2.jpg'],
        inventory: { quantity: 50 },
        status: 'active'
      });

      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product2._id.toString(),
          quantity: 1
        });

      // Clear cart
      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cart.items.length).toBe(0);
      expect(response.body.cart.total).toBe(0);
    });
  });

  describe('Cart Total Calculation', () => {
    it('should calculate correct total with multiple items', async () => {
      // Add first item
      const addResponse1 = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: productId.toString(),
          quantity: 2 // 29.99 * 2 = 59.98
        });
      
      expect(addResponse1.status).toBe(200);
      expect(addResponse1.body.success).toBe(true);

      // Create and add second item
      const product2 = await Product.create({
        name: 'Product 2',
        description: 'Description',
        price: 19.99,
        sku: `TEST-002-${Date.now()}`, // Unique SKU to avoid conflicts
        category: categoryId,
        images: ['image2.jpg'],
        inventory: { quantity: 50 },
        status: 'active'
      });

      const addResponse2 = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product2._id.toString(),
          quantity: 3 // 19.99 * 3 = 59.97
        });

      expect(addResponse2.status).toBe(200);
      expect(addResponse2.body.success).toBe(true);

      // Get cart and verify total
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.cart.items.length).toBe(2);
      expect(response.body.cart.total).toBe(119.95); // 59.98 + 59.97
    });

    it('should update total when quantity changes', async () => {
      // Add item
      const addResponse = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: productId.toString(),
          quantity: 1
        });

      const itemId = addResponse.body.cart.items[0]._id;

      // Update quantity
      const updateResponse = await request(app)
        .put(`/api/cart/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          quantity: 5
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.cart.total).toBe(149.95); // 29.99 * 5
    });
  });
});

