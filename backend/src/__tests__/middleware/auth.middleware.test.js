jest.mock('../../config/database', () => jest.fn().mockResolvedValue(false));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const { connect, disconnect, clear } = require('../helpers/dbHelper');

const JWT_SECRET = 'farmdirect_secret_key';

beforeAll(connect);
afterAll(disconnect);
beforeEach(clear);

describe('Authentication Middleware', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).post('/api/fruits').send({});
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  it('returns 401 when header does not start with Bearer', async () => {
    const res = await request(app)
      .post('/api/fruits')
      .set('Authorization', 'Basic abc123')
      .send({});
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  it('returns 401 with Bearer but no token value', async () => {
    const res = await request(app)
      .post('/api/fruits')
      .set('Authorization', 'Bearer ')
      .send({});
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  it('returns 401 when token is invalid', async () => {
    const res = await request(app)
      .post('/api/fruits')
      .set('Authorization', 'Bearer not.a.real.token')
      .send({});
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });

  it('allows request through with a valid JWT', async () => {
    const token = jwt.sign(
      { id: 'f1', role: 'farmer', name: 'Tester', email: 't@t.com' },
      JWT_SECRET
    );
    const res = await request(app)
      .post('/api/fruits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Apple', price: 1.5, quantity: 10, category: 'Apple' });
    // Should NOT be 401 — the middleware passed through
    expect(res.status).not.toBe(401);
  });
});
