// IMPORTANT: Require setup FIRST before any other imports
require('./setup');

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../models/User');

const { connectDB, disconnectDB, clearDatabase } = require('./dbHelper');

// Test database setup
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

describe('Authentication Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test123456'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.password).toBeUndefined(); // Password should not be in response
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Test123456'
        });

      expect(response.status).toBe(400);
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123'
        });

      expect(response.status).toBe(400);
    });

    it('should reject duplicate email', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test123456'
        });

      // Try to register again with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'test@example.com',
          password: 'Test123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test123456'
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123456'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123456'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    let userId;

    beforeEach(async () => {
      // Register and login to get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test123456'
        });

      token = registerResponse.body.token;
      userId = registerResponse.body.user.id;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_123');

      expect(response.status).toBe(401);
    });
  });
});

