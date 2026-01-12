const request = require('supertest');
// globals are enabled in vitest.config.mjs
const app = require('../index');
const mongoose = require('mongoose');
const User = require('../models/User');

// Create a test user variable to be reused
const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123'
};

describe('Auth API', () => {
    // Before running tests, clear the test user if exists
    beforeAll(async () => {
        // If you are using a real DB, be careful. Ideally connect to a test DB.
        // For this demo, we assume the existing DB is okay to use but we clean up our test data.
        await User.deleteOne({ email: testUser.email });
    });

    afterAll(async () => {
        // Clean up
        await User.deleteOne({ email: testUser.email });
        // Close mongoose connection to allow vitest to exit
        await mongoose.connection.close();
    });

    it('POST /api/register - should create a new user', async () => {
        const res = await request(app)
            .post('/api/register')
            .send(testUser);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('email', testUser.email);
    });

    it('POST /api/login - should login successfully with correct credentials', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.message).toBe('登入成功');
    });

    it('POST /api/login - should fail with wrong password', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('帳號或密碼錯誤');
    });
});
