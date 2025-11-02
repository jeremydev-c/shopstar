// IMPORTANT: Require setup FIRST before any other imports
require('./setup');

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
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

describe('Category Routes', () => {
  let adminToken;
  let customerToken;

  beforeEach(async () => {
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

    // Create customer user
    const customerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Customer User',
        email: 'customer@example.com',
        password: 'Customer123456'
      });
    customerToken = customerResponse.body.token;
  });

  describe('GET /api/categories', () => {
    it('should get all categories (public route)', async () => {
      await Category.create([
        {
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic products'
        },
        {
          name: 'Clothing',
          slug: 'clothing',
          description: 'Clothing items'
        }
      ]);

      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.categories.length).toBe(2);
    });

    it('should return empty array if no categories', async () => {
      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body.categories.length).toBe(0);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should get single category', async () => {
      const category = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic products'
      });

      const response = await request(app)
        .get(`/api/categories/${category._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.category.name).toBe('Electronics');
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/categories/${fakeId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/categories', () => {
    it('should create category (admin only)', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Category',
          slug: 'new-category',
          description: 'Category description'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.category.name).toBe('New Category');
      expect(response.body.category.slug).toBe('new-category');
    });

    it('should auto-generate slug from name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Home & Garden',
          description: 'Home products'
        });

      expect(response.status).toBe(201);
      expect(response.body.category.slug).toBe('home-garden');
    });

    it('should reject creation from non-admin', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'New Category',
          slug: 'new-category'
        });

      expect(response.status).toBe(403);
    });

    it('should reject category without name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'new-category'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/categories/:id', () => {
    let categoryId;

    beforeEach(async () => {
      const category = await Category.create({
        name: 'Original Category',
        slug: 'original-category'
      });
      categoryId = category._id;
    });

    it('should update category (admin only)', async () => {
      const response = await request(app)
        .put(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Category',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.category.name).toBe('Updated Category');
      expect(response.body.category.description).toBe('Updated description');
    });

    it('should reject update from non-admin', async () => {
      const response = await request(app)
        .put(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Updated Category'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    let categoryId;

    beforeEach(async () => {
      const category = await Category.create({
        name: 'Category to Delete',
        slug: 'category-to-delete'
      });
      categoryId = category._id;
    });

    it('should delete category (admin only)', async () => {
      const response = await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify soft delete (isActive set to false)
      const deletedCategory = await Category.findById(categoryId);
      expect(deletedCategory).toBeDefined();
      expect(deletedCategory.isActive).toBe(false);
    });

    it('should reject deletion from non-admin', async () => {
      const response = await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });
  });
});

