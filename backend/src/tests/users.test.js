// IMPORTANT: Require setup FIRST before any other imports
require('./setup');

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
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

describe('User Management Routes (Admin)', () => {
  let adminToken;
  let adminId;
  let customerToken;
  let customerId;

  beforeEach(async () => {
    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin123456',
      role: 'admin'
    });
    adminId = admin._id;

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
    customerId = customerResponse.body.user.id;
  });

  describe('GET /api/users/admin/all', () => {
    it('should get all users (admin only)', async () => {
      // Create additional users
      await User.create([
        {
          name: 'User 1',
          email: 'user1@example.com',
          password: 'User1123456',
          role: 'customer'
        },
        {
          name: 'User 2',
          email: 'user2@example.com',
          password: 'User2123456',
          role: 'customer'
        }
      ]);

      const response = await request(app)
        .get('/api/users/admin/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users.length).toBeGreaterThanOrEqual(3); // Admin + Customer + additional users
      expect(response.body.users[0].password).toBeUndefined(); // Password should not be returned
    });

    it('should reject access from non-admin', async () => {
      const response = await request(app)
        .get('/api/users/admin/all')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    it('should search users by name', async () => {
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'John123456'
      });

      const response = await request(app)
        .get('/api/users/admin/all?search=John')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const johnUser = response.body.users.find(u => u.name === 'John Doe');
      expect(johnUser).toBeDefined();
    });

    it('should search users by email', async () => {
      const response = await request(app)
        .get('/api/users/admin/all?search=customer@example.com')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const customerUser = response.body.users.find(u => u.email === 'customer@example.com');
      expect(customerUser).toBeDefined();
    });
  });

  describe('PUT /api/users/:id/role', () => {
    it('should update user role to admin (admin only)', async () => {
      const response = await request(app)
        .put(`/api/users/${customerId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'admin'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('admin');

      // Verify in database
      const updatedUser = await User.findById(customerId);
      expect(updatedUser.role).toBe('admin');
    });

    it('should update user role to customer (admin only)', async () => {
      // Create another admin first
      const admin2 = await User.create({
        name: 'Admin 2',
        email: 'admin2@example.com',
        password: 'Admin2123456',
        role: 'admin'
      });

      const response = await request(app)
        .put(`/api/users/${admin2._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'customer'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('customer');
    });

    it('should prevent removing last admin', async () => {
      // Try to remove admin role from the only admin
      const response = await request(app)
        .put(`/api/users/${adminId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'customer'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('last admin');
    });

    it('should reject role update from non-admin', async () => {
      const response = await request(app)
        .put(`/api/users/${customerId}/role`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          role: 'admin'
        });

      expect(response.status).toBe(403);
    });

    it('should reject invalid role', async () => {
      const response = await request(app)
        .put(`/api/users/${customerId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'invalid_role'
        });

      expect(response.status).toBe(400);
    });

    it('should reject update for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/users/${fakeId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'admin'
        });

      expect(response.status).toBe(404);
    });
  });
});

