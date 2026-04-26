import request from 'supertest';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import User from '../models/userModel.js';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Import and use routes
  import('../routes/userRoutes.js').then(module => {
    app.use('/api/auth', module.default);
  });

  return app;
};

describe('Auth API Tests', () => {
  let app;

  beforeAll(async () => {
    app = createTestApp();
    // Give time for routes to load
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('token');
      expect(response.body.name).toBe(userData.name);
      expect(response.body.email).toBe(userData.email);
      expect(response.body.role).toBe('user');
      expect(response.body.status).toBe('active');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'existinguser@example.com',
        password: 'password123'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'User already exists');
    });

    it('should not register user with short password', async () => {
      const userData = {
        name: 'Test User',
        email: 'shortpass@example.com',
        password: 'short'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('8 characters');
    });

    it('should not register user with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User' });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      const userData = {
        name: 'Login Test User',
        email: 'logintest@example.com',
        password: 'password123'
      };
      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.email).toBe('logintest@example.com');
      expect(response.body.role).toBe('user');
      expect(response.body.status).toBe('active');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should not login when account is disabled', async () => {
      const user = await User.findOne({ email: 'logintest@example.com' });
      user.status = 'disabled';
      await user.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Account disabled');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid');
    });

    it('should not login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid');
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      // Create and login a user
      const userData = {
        name: 'Profile Test User',
        email: 'profiletest@example.com',
        password: 'password123'
      };
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);
      token = registerResponse.body.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Profile Test User');
      expect(response.body).toHaveProperty('email', 'profiletest@example.com');
      expect(response.body).toHaveProperty('role', 'user');
      expect(response.body).toHaveProperty('status', 'active');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should block disabled account from profile access', async () => {
      const registeredUser = await User.findOne({ email: 'profiletest@example.com' });
      registeredUser.status = 'disabled';
      await registeredUser.save();

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Account disabled');
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('no token');
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Editable User',
          email: 'editable@example.com',
          password: 'password123'
        });
      token = registerResponse.body.token;
    });

    it('should update current user profile name', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.email).toBe('editable@example.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should require a name when updating profile', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('name is required');
    });
  });

  describe('PUT /api/auth/password', () => {
    let token;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Password User',
          email: 'passworduser@example.com',
          password: 'password123'
        });
      token = registerResponse.body.token;
    });

    it('should update password and allow login with the new password', async () => {
      const updateResponse = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'newpassword123' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.message).toBe('Password updated successfully');

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'passworduser@example.com',
          password: 'newpassword123'
        });

      expect(loginResponse.status).toBe(201);
      expect(loginResponse.body.email).toBe('passworduser@example.com');
    });

    it('should reject short passwords', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'short' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('8 characters');
    });
  });
});
