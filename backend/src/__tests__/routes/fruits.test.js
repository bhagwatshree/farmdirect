jest.mock('../../config/database', () => jest.fn().mockResolvedValue(false));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const Fruit = require('../../models/Fruit');
const { connect, disconnect, clear } = require('../helpers/dbHelper');

const JWT_SECRET = 'farmdirect_secret_key';
const farmerToken = jwt.sign(
  { id: 'farmer-1', role: 'farmer', name: 'Test Farm', email: 'farm@t.com' },
  JWT_SECRET
);
const otherFarmerToken = jwt.sign(
  { id: 'farmer-2', role: 'farmer', name: 'Other Farm', email: 'other@t.com' },
  JWT_SECRET
);
const customerToken = jwt.sign(
  { id: 'cust-1', role: 'customer', name: 'Customer', email: 'cust@t.com' },
  JWT_SECRET
);

const makeFruit = (overrides = {}) => ({
  _id: `fruit-${Date.now()}-${Math.random()}`,
  farmerId: 'farmer-1',
  farmerName: 'Test Farm',
  name: 'Apple',
  category: 'Apple',
  price: 2.5,
  unit: 'kg',
  quantity: 100,
  location: 'California',
  description: 'Fresh apples',
  images: [],
  transportCostPerUnit: 0,
  ...overrides,
});

beforeAll(connect);
afterAll(disconnect);
beforeEach(clear);

// ── GET / ───────────────────────────────────────────────────────────────────
describe('GET /api/fruits', () => {
  beforeEach(async () => {
    await Fruit.create([
      makeFruit({ _id: 'f1', category: 'Apple', quantity: 50, location: 'California' }),
      makeFruit({ _id: 'f2', category: 'Mango', quantity: 0, farmerId: 'farmer-2', farmerName: 'Other', description: 'sweet mango' }),
      makeFruit({ _id: 'f3', category: 'Lemon', quantity: 20, location: 'Florida', name: 'Meyer Lemon' }),
    ]);
  });

  it('returns only in-stock fruits (quantity > 0) by default', async () => {
    const res = await request(app).get('/api/fruits');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every(f => f.quantity > 0)).toBe(true);
  });

  it('filters by category', async () => {
    const res = await request(app).get('/api/fruits?category=Apple');
    expect(res.status).toBe(200);
    expect(res.body.every(f => f.category === 'Apple')).toBe(true);
  });

  it('does not filter when category=All', async () => {
    const res = await request(app).get('/api/fruits?category=All');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('filters by search term matching name', async () => {
    const res = await request(app).get('/api/fruits?search=lemon');
    expect(res.status).toBe(200);
    expect(res.body.some(f => f.name === 'Meyer Lemon')).toBe(true);
  });

  it('filters by search term matching location', async () => {
    const res = await request(app).get('/api/fruits?search=florida');
    expect(res.status).toBe(200);
    expect(res.body.some(f => f.location === 'Florida')).toBe(true);
  });

  it('filters by search term matching description', async () => {
    await Fruit.create(makeFruit({ _id: 'f4', category: 'Mango', quantity: 10, description: 'alphonso variety' }));
    const res = await request(app).get('/api/fruits?search=alphonso');
    expect(res.status).toBe(200);
    expect(res.body.some(f => f._id === 'f4')).toBe(true);
  });

  it('filters by farmerId and includes out-of-stock items', async () => {
    const res = await request(app).get('/api/fruits?farmerId=farmer-1');
    expect(res.status).toBe(200);
    expect(res.body.every(f => f.farmerId === 'farmer-1')).toBe(true);
  });
});

// ── GET /:id ────────────────────────────────────────────────────────────────
describe('GET /api/fruits/:id', () => {
  beforeEach(async () => {
    await Fruit.create(makeFruit({ _id: 'known-fruit' }));
  });

  it('returns 200 with the fruit when id is valid', async () => {
    const res = await request(app).get('/api/fruits/known-fruit');
    expect(res.status).toBe(200);
    expect(res.body._id).toBe('known-fruit');
  });

  it('returns 404 for an unknown fruit id', async () => {
    const res = await request(app).get('/api/fruits/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Not found');
  });
});

// ── POST / ──────────────────────────────────────────────────────────────────
describe('POST /api/fruits', () => {
  it('returns 401 when no auth token', async () => {
    const res = await request(app).post('/api/fruits').send({ name: 'Orange', price: 2, quantity: 10, category: 'Orange' });
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is a customer', async () => {
    const res = await request(app)
      .post('/api/fruits')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Orange', price: 2, quantity: 10, category: 'Orange' });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Farmers only');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/fruits')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ name: 'Orange' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('creates a fruit listing and returns 201 with filtered images', async () => {
    const res = await request(app)
      .post('/api/fruits')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        name: 'Berry', price: 4, quantity: 30, category: 'Berry',
        unit: 'kg', images: ['https://img.com/1.jpg', '', 'https://img.com/2.jpg'],
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Berry');
    expect(res.body.farmerId).toBe('farmer-1');
    expect(res.body.images).toEqual(['https://img.com/1.jpg', 'https://img.com/2.jpg']);
  });

  it('defaults unit to kg when not provided', async () => {
    const res = await request(app)
      .post('/api/fruits')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ name: 'Lemon', price: 2, quantity: 50, category: 'Lemon' });
    expect(res.status).toBe(201);
    expect(res.body.unit).toBe('kg');
  });

  it('saves transportCostPerUnit when provided', async () => {
    const res = await request(app)
      .post('/api/fruits')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ name: 'Mango', price: 5, quantity: 20, category: 'Mango', transportCostPerUnit: 1.25 });
    expect(res.status).toBe(201);
    expect(res.body.transportCostPerUnit).toBe(1.25);
  });

  it('defaults transportCostPerUnit to 0 when not provided', async () => {
    const res = await request(app)
      .post('/api/fruits')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ name: 'Orange', price: 2, quantity: 10, category: 'Orange' });
    expect(res.status).toBe(201);
    expect(res.body.transportCostPerUnit).toBe(0);
  });
});

// ── PUT /:id ─────────────────────────────────────────────────────────────────
describe('PUT /api/fruits/:id', () => {
  beforeEach(async () => {
    await Fruit.create(makeFruit({ _id: 'upd-fruit', name: 'Old Name', price: 1, quantity: 5 }));
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).put('/api/fruits/upd-fruit').send({ name: 'New' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for a customer', async () => {
    const res = await request(app)
      .put('/api/fruits/upd-fruit')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'New' });
    expect(res.status).toBe(403);
  });

  it('returns 404 when fruit belongs to a different farmer', async () => {
    const res = await request(app)
      .put('/api/fruits/upd-fruit')
      .set('Authorization', `Bearer ${otherFarmerToken}`)
      .send({ name: 'Hijack' });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Not found or unauthorized');
  });

  it('updates and returns the updated fruit', async () => {
    const res = await request(app)
      .put('/api/fruits/upd-fruit')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ name: 'New Apple', price: 3.5, quantity: 200 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Apple');
    expect(res.body.price).toBe(3.5);
    expect(res.body.quantity).toBe(200);
  });

  it('updates transportCostPerUnit on PUT', async () => {
    const res = await request(app)
      .put('/api/fruits/upd-fruit')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ transportCostPerUnit: 2.00 });
    expect(res.status).toBe(200);
    expect(res.body.transportCostPerUnit).toBe(2.00);
  });
});

// ── DELETE /:id ──────────────────────────────────────────────────────────────
describe('DELETE /api/fruits/:id', () => {
  beforeEach(async () => {
    await Fruit.create(makeFruit({ _id: 'del-fruit' }));
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).delete('/api/fruits/del-fruit');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a customer', async () => {
    const res = await request(app)
      .delete('/api/fruits/del-fruit')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 404 for unknown or unauthorized fruit', async () => {
    const res = await request(app)
      .delete('/api/fruits/nonexistent')
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(res.status).toBe(404);
  });

  it('deletes the fruit and returns confirmation', async () => {
    const res = await request(app)
      .delete('/api/fruits/del-fruit')
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Listing deleted');
    const gone = await Fruit.findById('del-fruit');
    expect(gone).toBeNull();
  });
});
