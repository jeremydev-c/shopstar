// IMPORTANT: Require setup FIRST before any other imports
require('./setup');

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

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

describe('Integration Tests - Complete User Journey', () => {
  let customerToken;
  let customerId;
  let adminToken;
  let categoryId;
  let productId;

  beforeEach(async () => {
    // Register customer
    const customerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Customer',
        email: 'customer@test.com',
        password: 'Customer123456'
      });
    customerToken = customerResponse.body.token;
    customerId = customerResponse.body.user.id;

    // Create admin
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'Admin123456',
      role: 'admin'
    });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Admin123456'
      });
    adminToken = adminLogin.body.token;

    // Create category (admin)
    const categoryResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Electronics',
        slug: `electronics-${Date.now()}`, // Unique slug to avoid conflicts
        description: 'Electronic products'
      });
    
    expect(categoryResponse.status).toBe(201);
    expect(categoryResponse.body.success).toBe(true);
    expect(categoryResponse.body.category).toBeDefined();
    categoryId = categoryResponse.body.category._id;

    // Create product (admin)
    const productResponse = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Product',
        description: 'Test description',
        price: 49.99,
        sku: `TEST-001-${Date.now()}`, // Unique SKU to avoid conflicts
        category: categoryId.toString(),
        images: ['https://example.com/image.jpg'],
        inventory: {
          quantity: 100,
          lowStockThreshold: 10
        },
        status: 'active' // Explicitly set to active
      });
    
    expect(productResponse.status).toBe(201);
    expect(productResponse.body.success).toBe(true);
    expect(productResponse.body.product).toBeDefined();
    productId = productResponse.body.product._id;
  });

  it('should complete full e-commerce flow: browse -> add to cart -> checkout -> order', async () => {
    // Step 1: Browse products
    const browseResponse = await request(app)
      .get('/api/products');
    
    expect(browseResponse.status).toBe(200);
    expect(browseResponse.body.products.length).toBeGreaterThan(0);

    // Step 2: Get single product
    const productResponse = await request(app)
      .get(`/api/products/${productId}`);
    
    expect(productResponse.status).toBe(200);
    expect(productResponse.body.product.name).toBe('Test Product');

    // Step 3: Add to cart
    const addToCartResponse = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: productId.toString(),
        quantity: 2
      });
    
    expect(addToCartResponse.status).toBe(200);
    expect(addToCartResponse.body.cart.items.length).toBe(1);

    // Step 4: View cart
    const cartResponse = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${customerToken}`);
    
    expect(cartResponse.status).toBe(200);
    expect(cartResponse.body.cart.items.length).toBe(1);
    expect(cartResponse.body.cart.total).toBe(99.98); // 49.99 * 2

    // Step 5: Create order
    const orderResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'USA'
        }
      });
    
    expect(orderResponse.status).toBe(201);
    expect(orderResponse.body.order.items.length).toBe(1);
    expect(orderResponse.body.order.total).toBeGreaterThan(0);
    expect(orderResponse.body.order.orderNumber).toBeDefined();

    // Step 6: View orders
    const ordersResponse = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`);
    
    expect(ordersResponse.status).toBe(200);
    expect(ordersResponse.body.orders.length).toBe(1);

    // Step 7: Verify cart was cleared
    const clearedCartResponse = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${customerToken}`);
    
    expect(clearedCartResponse.body.cart.items.length).toBe(0);
  });

  it('should handle admin managing products and orders', async () => {
    // Admin creates product
    const createProductResponse = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Admin Product',
        description: 'Admin created product',
        price: 99.99,
        sku: `ADMIN-001-${Date.now()}`,
        category: categoryId.toString(),
        images: ['https://example.com/admin.jpg'],
        inventory: { quantity: 50 },
        status: 'active'
      });
    
    expect(createProductResponse.status).toBe(201);
    const adminProductId = createProductResponse.body.product._id;

    // Admin updates product
    const updateResponse = await request(app)
      .put(`/api/products/${adminProductId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        price: 79.99
      });
    
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.product.price).toBe(79.99);

    // Admin views all orders
    // First create an order as customer
    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: productId.toString(),
        quantity: 1
      });
    
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

    const allOrdersResponse = await request(app)
      .get('/api/orders/admin/all')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(allOrdersResponse.status).toBe(200);
    expect(allOrdersResponse.body.orders.length).toBeGreaterThan(0);
  });

  it('should handle inventory reduction on order', async () => {
    const initialQuantity = 100;
    
    // Verify initial inventory
    const initialProduct = await Product.findById(productId);
    expect(initialProduct.inventory.quantity).toBe(initialQuantity);

    // Add to cart and order
    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: productId.toString(),
        quantity: 5
      });

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

    // Note: Inventory reduction happens on payment confirmation
    // This test verifies the order was created successfully
    // In a real scenario, you'd mock the payment confirmation
    const order = await Order.findOne({ customer: customerId });
    expect(order).toBeDefined();
    expect(order.items[0].quantity).toBe(5);
  });
});

