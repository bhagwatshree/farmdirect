jest.mock('../../config/database', () => jest.fn().mockResolvedValue(false));

const request = require('supertest');
const app = require('../../app');
const { connect, disconnect, clear } = require('../helpers/dbHelper');

beforeAll(connect);
afterAll(disconnect);
beforeEach(clear);

describe('POST /api/auth/register', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', password: 'pass', role: 'customer' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when role is not farmer or customer', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'a@t.com', password: 'pass', role: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/farmer or customer/);
  });

  it('returns 400 when email is already registered', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'First', email: 'dup@test.com', password: 'pass', role: 'customer' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Second', email: 'dup@test.com', password: 'pass', role: 'customer' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email already registered');
  });

  it('creates a customer account and returns token + safe user object', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123', role: 'customer', location: 'NY' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.name).toBe('Alice');
    expect(res.body.user.role).toBe('customer');
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('creates a farmer account with optional phone', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Farmer Bob', email: 'bob@farm.com', password: 'farmpass', role: 'farmer', phone: '555-1234' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('farmer');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@login.com', password: 'secret123', role: 'customer' });
  });

  it('returns 400 when email is not registered', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'secret123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('returns 400 when password is incorrect', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@login.com', password: 'wrongpassword' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('returns 200 with token and user on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@login.com', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('alice@login.com');
    expect(res.body.user.role).toBe('customer');
    expect(res.body.user).not.toHaveProperty('password');
  });
});
