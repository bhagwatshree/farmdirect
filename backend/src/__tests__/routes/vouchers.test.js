jest.mock('../../config/database', () => jest.fn().mockResolvedValue(false));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const Voucher = require('../../models/Voucher');
const { connect, disconnect, clear } = require('../helpers/dbHelper');

const JWT_SECRET = 'farmdirect_secret_key';
const authToken = jwt.sign(
  { id: 'user-1', role: 'customer', name: 'Test User', email: 'user@t.com' },
  JWT_SECRET
);
const farmerToken = jwt.sign(
  { id: 'farmer-1', role: 'farmer', name: 'Farm', email: 'farm@t.com' },
  JWT_SECRET
);

const seedVoucher = (overrides = {}) => ({
  _id: 'v-seed',
  code: 'TEST10',
  type: 'percentage',
  value: 10,
  minOrderAmount: 0,
  maxUses: 100,
  usedCount: 0,
  expiresAt: '2099-01-01T00:00:00Z',
  isActive: true,
  ...overrides,
});

beforeAll(connect);
afterAll(disconnect);
beforeEach(clear);

// ── GET / ────────────────────────────────────────────────────────────────────
describe('GET /api/vouchers', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/vouchers');
    expect(res.status).toBe(401);
  });

  it('returns empty array when no vouchers exist', async () => {
    const res = await request(app)
      .get('/api/vouchers')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns only active vouchers', async () => {
    await Voucher.create(seedVoucher({ code: 'ACTIVE', isActive: true }));
    await Voucher.create(seedVoucher({ _id: 'v-inactive', code: 'INACTIVE', isActive: false }));
    const res = await request(app)
      .get('/api/vouchers')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].code).toBe('ACTIVE');
  });

  it('returns vouchers for farmer role too', async () => {
    await Voucher.create(seedVoucher());
    const res = await request(app)
      .get('/api/vouchers')
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

// ── POST / ───────────────────────────────────────────────────────────────────
describe('POST /api/vouchers', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/vouchers').send({ code: 'X', type: 'fixed', value: 5 });
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/vouchers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code: 'MISSING' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('returns 400 for invalid type', async () => {
    const res = await request(app)
      .post('/api/vouchers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code: 'BAD', type: 'freebie', value: 10 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/type must be/i);
  });

  it('returns 400 when value is 0 or negative', async () => {
    const res = await request(app)
      .post('/api/vouchers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code: 'ZERO', type: 'fixed', value: 0 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/greater than 0/i);
  });

  it('returns 400 when percentage value exceeds 100', async () => {
    const res = await request(app)
      .post('/api/vouchers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code: 'BIG', type: 'percentage', value: 101 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot exceed 100/i);
  });

  it('returns 409 when voucher code already exists', async () => {
    await Voucher.create(seedVoucher({ code: 'DUP' }));
    const res = await request(app)
      .post('/api/vouchers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code: 'dup', type: 'fixed', value: 5 }); // case-insensitive
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('creates a percentage voucher and returns 201', async () => {
    const res = await request(app)
      .post('/api/vouchers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code: 'SUMMER20', type: 'percentage', value: 20, minOrderAmount: 15, maxUses: 50 });
    expect(res.status).toBe(201);
    expect(res.body.code).toBe('SUMMER20');
    expect(res.body.type).toBe('percentage');
    expect(res.body.value).toBe(20);
    expect(res.body.minOrderAmount).toBe(15);
    expect(res.body.maxUses).toBe(50);
    expect(res.body.usedCount).toBe(0);
    expect(res.body.isActive).toBe(true);
    expect(res.body._id).toBeDefined();
  });

  it('creates a fixed voucher with defaults', async () => {
    const res = await request(app)
      .post('/api/vouchers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code: 'SAVE5', type: 'fixed', value: 5 });
    expect(res.status).toBe(201);
    expect(res.body.minOrderAmount).toBe(0);
    expect(res.body.maxUses).toBe(0);
    expect(res.body.expiresAt).toBeNull();
  });

  it('uppercases the voucher code on creation', async () => {
    const res = await request(app)
      .post('/api/vouchers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code: 'lowercase', type: 'fixed', value: 3 });
    expect(res.status).toBe(201);
    expect(res.body.code).toBe('LOWERCASE');
  });
});

// ── POST /validate ───────────────────────────────────────────────────────────
describe('POST /api/vouchers/validate', () => {
  it('returns 400 when code is missing', async () => {
    const res = await request(app).post('/api/vouchers/validate').send({ subtotal: 10 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/code is required/i);
  });

  it('returns 404 for a non-existent code', async () => {
    const res = await request(app).post('/api/vouchers/validate').send({ code: 'GHOST' });
    expect(res.status).toBe(404);
    expect(res.body.valid).toBe(false);
  });

  it('returns 400 for an inactive voucher', async () => {
    await Voucher.create(seedVoucher({ code: 'OFF', isActive: false }));
    const res = await request(app).post('/api/vouchers/validate').send({ code: 'OFF' });
    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  it('returns 400 for an expired voucher', async () => {
    await Voucher.create(seedVoucher({ code: 'OLD', expiresAt: '2000-01-01T00:00:00Z' }));
    const res = await request(app).post('/api/vouchers/validate').send({ code: 'OLD' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  it('returns 400 when maxUses is reached', async () => {
    await Voucher.create(seedVoucher({ code: 'MAXED', maxUses: 1, usedCount: 1 }));
    const res = await request(app).post('/api/vouchers/validate').send({ code: 'MAXED' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/usage limit/i);
  });

  it('returns 400 when subtotal is below minOrderAmount', async () => {
    await Voucher.create(seedVoucher({ code: 'HIGHMIN', minOrderAmount: 50 }));
    const res = await request(app).post('/api/vouchers/validate').send({ code: 'HIGHMIN', subtotal: 10 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Minimum order/i);
  });

  it('validates a percentage voucher and returns correct discountAmount', async () => {
    await Voucher.create(seedVoucher({ code: 'PCT20', type: 'percentage', value: 20 }));
    const res = await request(app).post('/api/vouchers/validate').send({ code: 'PCT20', subtotal: 50 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discountAmount).toBe(10); // 20% of 50
    expect(res.body.code).toBe('PCT20');
  });

  it('validates a fixed voucher and caps discount at subtotal', async () => {
    await Voucher.create(seedVoucher({ code: 'FIX100', type: 'fixed', value: 100 }));
    const res = await request(app).post('/api/vouchers/validate').send({ code: 'FIX100', subtotal: 5 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discountAmount).toBe(5); // capped at subtotal
  });

  it('is case-insensitive for the code', async () => {
    await Voucher.create(seedVoucher({ code: 'UPPER' }));
    const res = await request(app).post('/api/vouchers/validate').send({ code: 'upper', subtotal: 20 });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it('does NOT require authentication', async () => {
    await Voucher.create(seedVoucher());
    const res = await request(app).post('/api/vouchers/validate').send({ code: 'TEST10', subtotal: 30 });
    expect(res.status).toBe(200); // public endpoint
  });

  it('validates when subtotal is 0 and minOrderAmount is 0', async () => {
    await Voucher.create(seedVoucher({ code: 'FREE', type: 'percentage', value: 50, minOrderAmount: 0 }));
    const res = await request(app).post('/api/vouchers/validate').send({ code: 'FREE', subtotal: 0 });
    expect(res.status).toBe(200);
    expect(res.body.discountAmount).toBe(0);
  });
});
