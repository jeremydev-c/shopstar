// IMPORTANT: Require setup FIRST before any other imports
require('./setup');

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Order = require('../models/Order');
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

describe('Order Routes', () => {
  let customerToken;
  let customerId;
  let adminToken;
  let productId;
  let categoryId;

  beforeEach(async () => {
    // Create customer user
    const customerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Customer User',
        email: 'customer@example.com',
        password: 'Customer123456'
      });
    customerToken = customerResponse.body.token;
    customerId = customerResponse.body.user.id;

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin123456',
      role: 'admin'
    });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin123456'
      });
    adminToken = adminLogin.body.token;

    // Create category
    const category = await Category.create({
      name: 'Electronics',
      slug: 'electronics'
    });
    categoryId = category._id;

    // Create product
    const product = await Product.create({
      name: 'Test Product',
      description: 'Test description',
      price: 99.99,
      sku: 'TEST-001',
      category: categoryId,
      images: ['https://example.com/image.jpg'],
      inventory: { quantity: 100 },
      status: 'active'
    });
    productId = product._id;

    // Add item to cart
    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: productId.toString(),
        quantity: 2
      });
  });

  describe('POST /api/orders', () => {
    it('should create order from cart', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'USA'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.items.length).toBe(1);
      expect(response.body.order.total).toBeGreaterThan(0);
      expect(response.body.order.orderNumber).toBeDefined();
    });

    it('should reject order with invalid shipping address', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            street: '',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'USA'
          }
        });

      expect(response.status).toBe(400);
    });

    it('should reject order with empty cart', async () => {
      // Clear cart
      await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'USA'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('empty');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'USA'
          }
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/orders', () => {
    beforeEach(async () => {
      // Ensure cart has items before creating order
      let cart = await Cart.findOne({ user: customerId });
      if (!cart || cart.items.length === 0) {
        cart = await Cart.findOne({ user: customerId }) || await Cart.create({ user: customerId, items: [] });
        await request(app)
          .post('/api/cart')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            productId: productId.toString(),
            quantity: 2
          });
      }
    });

    it('should get user orders', async () => {
      // Create an order first
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'USA'
          }
        });

      expect(orderResponse.status).toBe(201);
      expect(orderResponse.body.success).toBe(true);

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.orders.length).toBeGreaterThan(0);
    });

    it('should only return user\'s own orders', async () => {
      // Create an order for the first user first
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'USA'
          }
        });

      // Create second user and order
      const user2 = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User 2',
          email: `user2-${Date.now()}@example.com`,
          password: 'User2123456'
        });
      
      // Add item to user2's cart via API
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${user2.body.token}`)
        .send({
          productId: productId.toString(),
          quantity: 1
        });
      
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${user2.body.token}`)
        .send({
          shippingAddress: {
            street: '456 Other St',
            city: 'Other City',
            state: 'Other State',
            zipCode: '67890',
            country: 'USA'
          }
        });

      // Get first user's orders
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      // Should only return orders for customerToken user
      response.body.orders.forEach(order => {
        expect(order.customer.toString()).toBe(customerId);
      });
    });
  });

  describe('GET /api/orders/:id', () => {
    let orderId;

    beforeEach(async () => {
      // Ensure cart has items
      let cart = await Cart.findOne({ user: customerId });
      if (!cart || cart.items.length === 0) {
        await request(app)
          .post('/api/cart')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            productId: productId.toString(),
            quantity: 2
          });
      }

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'USA'
          }
        });
      
      expect(orderResponse.status).toBe(201);
      expect(orderResponse.body.order).toBeDefined();
      orderId = orderResponse.body.order._id;
    });

    it('should get single order', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.order._id).toBe(orderId.toString());
    });

    it('should reject access to other user\'s order', async () => {
      const user2 = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User 2',
          email: 'user2@example.com',
          password: 'User2123456'
        });

      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${user2.body.token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    let orderId;

    beforeEach(async () => {
      // Ensure cart has items
      let cart = await Cart.findOne({ user: customerId });
      if (!cart || cart.items.length === 0) {
        await request(app)
          .post('/api/cart')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            productId: productId.toString(),
            quantity: 2
          });
      }

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'USA'
          }
        });
      
      expect(orderResponse.status).toBe(201);
      expect(orderResponse.body.order).toBeDefined();
      orderId = orderResponse.body.order._id;
    });

    it('should update order status (admin only)', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'shipped',
          trackingNumber: 'TRACK123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.order.status).toBe('shipped');
      expect(response.body.order.trackingNumber).toBe('TRACK123');
    });

    it('should reject status update from non-admin', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          status: 'shipped'
        });

      expect(response.status).toBe(403);
    });

    it('should reject invalid status', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'invalid_status'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/orders/:id', () => {
    let orderId;

    beforeEach(async () => {
      // Ensure cart has items
      let cart = await Cart.findOne({ user: customerId });
      if (!cart || cart.items.length === 0) {
        await request(app)
          .post('/api/cart')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            productId: productId.toString(),
            quantity: 2
          });
      }

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'USA'
          }
        });
      
      expect(orderResponse.status).toBe(201);
      expect(orderResponse.body.order).toBeDefined();
      orderId = orderResponse.body.order._id;
    });

    it('should cancel pending order', async () => {
      const response = await request(app)
        .delete(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject cancellation of other user\'s order', async () => {
      const user2 = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User 2',
          email: 'user2@example.com',
          password: 'User2123456'
        });

      const response = await request(app)
        .delete(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${user2.body.token}`);

      expect(response.status).toBe(403);
    });
  });
});

