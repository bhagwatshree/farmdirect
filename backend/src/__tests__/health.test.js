jest.mock('../config/database', () => jest.fn().mockResolvedValue(false));

const request = require('supertest');
const app = require('../app');
const { connect, disconnect } = require('./helpers/dbHelper');

beforeAll(connect);
afterAll(disconnect);

describe('GET /api/health', () => {
  it('returns 200 with status message', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Backend is running!');
  });
});
