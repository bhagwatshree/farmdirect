jest.mock('../../config/database', () => jest.fn().mockResolvedValue(false));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const Fruit = require('../../models/Fruit');
const Voucher = require('../../models/Voucher');
const { connect, disconnect, clear } = require('../helpers/dbHelper');

const JWT_SECRET = 'farmdirect_secret_key';
const farmerToken = jwt.sign(
  { id: 'farmer-1', role: 'farmer', name: 'Farmer', email: 'farmer@t.com' },
  JWT_SECRET
);
const customerToken = jwt.sign(
  { id: 'cust-1', role: 'customer', name: 'Customer', email: 'cust@t.com' },
  JWT_SECRET
);
const customer2Token = jwt.sign(
  { id: 'cust-2', role: 'customer', name: 'Customer2', email: 'cust2@t.com' },
  JWT_SECRET
);

const baseFruit = () => ({
  _id: 'test-fruit',
  farmerId: 'farmer-1',
  farmerName: 'Farmer',
  name: 'Apple',
  category: 'Apple',
  price: 2.00,
  unit: 'kg',
  quantity: 100,
  location: 'CA',
  description: '',
  images: [],
  transportCostPerUnit: 0,
});

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
beforeEach(async () => {
  await clear();
  await Fruit.create(baseFruit());
});

// ── POST / ──────────────────────────────────────────────────────────────────
describe('POST /api/orders', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/orders').send({ items: [{ fruitId: 'test-fruit', quantity: 1 }] });
    expect(res.status).toBe(401);
  });

  it('returns 403 when a farmer tries to place an order', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 1 }] });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Customers only');
  });

  it('returns 400 when items array is missing', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No items in order');
  });

  it('returns 400 when items array is empty', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [] });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No items in order');
  });

  it('returns 400 when fruit is not found', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'nonexistent', quantity: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Fruit not found/);
  });

  it('returns 400 when requested quantity exceeds stock', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 999 }] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/available/);
  });

  it('creates the order, deducts stock, and returns 201', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 5 }] });
    expect(res.status).toBe(201);
    expect(res.body.total).toBe(10);
    expect(res.body.status).toBe('pending');
    expect(res.body.customerId).toBe('cust-1');
    const updatedFruit = await Fruit.findById('test-fruit');
    expect(updatedFruit.quantity).toBe(95);
  });

  it('stores billingAddress and deliveryAddress on the order', async () => {
    const billing = { street: '123 Main St', city: 'Springfield', state: 'CA', postalCode: '12345', country: 'USA' };
    const delivery = { street: '456 Oak Ave', city: 'Shelbyville', state: 'CA', postalCode: '67890', country: 'USA' };
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 1 }], billingAddress: billing, deliveryAddress: delivery });
    expect(res.status).toBe(201);
    expect(res.body.billingAddress).toMatchObject(billing);
    expect(res.body.deliveryAddress).toMatchObject(delivery);
  });

  it('uses billingAddress as deliveryAddress when deliveryAddress is omitted', async () => {
    const billing = { street: '123 Main St', city: 'Springfield', state: 'CA', postalCode: '12345', country: 'USA' };
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 1 }], billingAddress: billing });
    expect(res.status).toBe(201);
    expect(res.body.deliveryAddress).toMatchObject(billing);
  });

  it('calculates transport cost correctly', async () => {
    await Fruit.findByIdAndUpdate('test-fruit', { transportCostPerUnit: 1.50 });
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 4 }] });
    expect(res.status).toBe(201);
    expect(res.body.subtotal).toBe(8);
    expect(res.body.transportCost).toBe(6);
    expect(res.body.total).toBe(14);
  });

  it('applies a percentage voucher and deducts discount from total', async () => {
    await Voucher.create(seedVoucher({ _id: 'v1', code: 'SAVE10', type: 'percentage', value: 10 }));
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 5 }], voucherCode: 'SAVE10' });
    expect(res.status).toBe(201);
    expect(res.body.subtotal).toBe(10);
    expect(res.body.discountAmount).toBe(1);
    expect(res.body.total).toBe(9);
    expect(res.body.voucherCode).toBe('SAVE10');
    const v = await Voucher.findById('v1');
    expect(v.usedCount).toBe(1);
  });

  it('applies a fixed voucher and deducts correct amount', async () => {
    await Voucher.create(seedVoucher({ _id: 'v2', code: 'FLAT3', type: 'fixed', value: 3, maxUses: 0 }));
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 5 }], voucherCode: 'FLAT3' });
    expect(res.status).toBe(201);
    expect(res.body.discountAmount).toBe(3);
    expect(res.body.total).toBe(7);
  });

  it('returns 400 when voucher code is invalid', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 1 }], voucherCode: 'BOGUS' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('returns 400 when voucher minOrderAmount is not met', async () => {
    await Voucher.create(seedVoucher({ _id: 'v3', code: 'BIG50', type: 'percentage', value: 50, minOrderAmount: 100 }));
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 1 }], voucherCode: 'BIG50' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Minimum order/i);
  });

  it('returns 400 when voucher has reached maxUses', async () => {
    await Voucher.create(seedVoucher({ _id: 'v4', code: 'USED', type: 'fixed', value: 5, maxUses: 1, usedCount: 1 }));
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 1 }], voucherCode: 'USED' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/usage limit/i);
  });

  it('returns 400 when voucher is expired', async () => {
    await Voucher.create(seedVoucher({ _id: 'v5', code: 'OLD', type: 'fixed', value: 5, expiresAt: '2000-01-01T00:00:00Z' }));
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 1 }], voucherCode: 'OLD' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  it('returns 400 when voucher is inactive', async () => {
    await Voucher.create(seedVoucher({ _id: 'v6', code: 'INACTIVE', type: 'fixed', value: 5, isActive: false }));
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 1 }], voucherCode: 'INACTIVE' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no longer active/i);
  });

  it('calculates total correctly with transport cost and voucher together', async () => {
    await Fruit.findByIdAndUpdate('test-fruit', { transportCostPerUnit: 2.00 });
    await Voucher.create(seedVoucher({ _id: 'v7', code: 'COMBO10', type: 'percentage', value: 10, maxUses: 0 }));
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 2 }], voucherCode: 'COMBO10' });
    expect(res.status).toBe(201);
    expect(res.body.subtotal).toBe(4);
    expect(res.body.transportCost).toBe(4);
    expect(res.body.discountAmount).toBe(0.4);
    expect(res.body.total).toBe(7.6);
  });
});

// ── GET / ───────────────────────────────────────────────────────────────────
describe('GET /api/orders', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 2 }] });
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it("returns only the authenticated customer's orders", async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].customerId).toBe('cust-1');
  });

  it('returns empty array for a customer with no orders', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${customer2Token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it("returns orders containing the farmer's items for farmer view", async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns empty for a farmer with no matching orders', async () => {
    const otherFarmer = jwt.sign(
      { id: 'farmer-99', role: 'farmer', name: 'Other', email: 'o@t.com' },
      JWT_SECRET
    );
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${otherFarmer}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

// ── PUT /:id/status ──────────────────────────────────────────────────────────
describe('PUT /api/orders/:id/status', () => {
  let orderId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ fruitId: 'test-fruit', quantity: 1 }] });
    orderId = res.body._id;
  });

  it('returns 403 when a customer tries to update status', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Farmers only');
  });

  it('returns 404 for an unknown order id', async () => {
    const res = await request(app)
      .put('/api/orders/nonexistent/status')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Order not found');
  });

  it('returns 400 for an invalid status value', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid status');
  });

  it('updates status to confirmed successfully', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });

  it('updates status through the full lifecycle', async () => {
    for (const status of ['confirmed', 'shipped', 'delivered']) {
      const res = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }
  });
});
