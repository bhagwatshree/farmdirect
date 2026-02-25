const { v4: uuidv4 } = require('uuid');
const Fruit = require('../models/Fruit');
const Voucher = require('../models/Voucher');

const BASE = 'https://images.unsplash.com';
const Q = '?w=800&q=80&auto=format&fit=crop';

const seedFruits = [
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-1',
    farmerName: 'Green Valley Farm',
    name: 'Organic Apples',
    description: 'Fresh crispy organic apples, hand-picked from our century-old orchard. No pesticides used.',
    price: 2.50, unit: 'kg', quantity: 150, location: 'California, USA', category: 'Apple',
    transportCostPerUnit: 0.50,
    images: [`${BASE}/photo-1570913149827-d2ac84ab3f9a${Q}`, `${BASE}/photo-1568702846914-96b305d2aaeb${Q}`],
  },
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-2',
    farmerName: 'Sunshine Orchards',
    name: 'Alphonso Mangoes',
    description: 'Premium Alphonso mangoes — the king of mangoes. Sweet, rich and aromatic.',
    price: 5.00, unit: 'kg', quantity: 80, location: 'Maharashtra, India', category: 'Mango',
    transportCostPerUnit: 1.00,
    images: [`${BASE}/photo-1601493700631-2b16ec4b4716${Q}`, `${BASE}/photo-1591073113125-e46713c829ed${Q}`],
  },
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-1',
    farmerName: 'Green Valley Farm',
    name: 'Valencia Oranges',
    description: 'Juicy Valencia oranges, perfect for fresh juice. Naturally sweet and full of Vitamin C.',
    price: 1.80, unit: 'kg', quantity: 200, location: 'California, USA', category: 'Orange',
    transportCostPerUnit: 0.75,
    images: [`${BASE}/photo-1611080626919-7cf5a9dbab12${Q}`],
  },
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-3',
    farmerName: 'Berry Good Farm',
    name: 'Fresh Strawberries',
    description: 'Sweet, plump strawberries picked at peak ripeness. Great for desserts and smoothies.',
    price: 4.00, unit: 'kg', quantity: 60, location: 'Oregon, USA', category: 'Berry',
    transportCostPerUnit: 1.50,
    images: [`${BASE}/photo-1464965911861-746a04b4bca6${Q}`],
  },
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-2',
    farmerName: 'Sunshine Orchards',
    name: 'Cavendish Bananas',
    description: 'Ripe, naturally sweet bananas. Great for smoothies, baking or a quick snack.',
    price: 1.20, unit: 'kg', quantity: 300, location: 'Ecuador', category: 'Banana',
    transportCostPerUnit: 0.25,
    images: [`${BASE}/photo-1571771894821-ce9b6c11b08e${Q}`],
  },
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-3',
    farmerName: 'Berry Good Farm',
    name: 'Seedless Red Grapes',
    description: 'Crunchy and sweet seedless red grapes. Perfect for snacking or wine-making.',
    price: 3.50, unit: 'kg', quantity: 90, location: 'Napa Valley, USA', category: 'Grapes',
    transportCostPerUnit: 1.00,
    images: [`${BASE}/photo-1537640538966-79f369143f8f${Q}`],
  },
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-1',
    farmerName: 'Green Valley Farm',
    name: 'Meyer Lemons',
    description: 'Sweet Meyer lemons with thin skin. Great for lemonade, cooking, and baking.',
    price: 2.00, unit: 'kg', quantity: 120, location: 'California, USA', category: 'Lemon',
    transportCostPerUnit: 0.50,
    images: [`${BASE}/photo-1590502593747-42a996133562${Q}`],
  },
  {
    _id: uuidv4(),
    farmerId: 'demo-farmer-2',
    farmerName: 'Sunshine Orchards',
    name: 'Golden Pineapples',
    description: 'Sun-ripened golden pineapples with intense tropical sweetness.',
    price: 3.00, unit: 'piece', quantity: 50, location: 'Costa Rica', category: 'Pineapple',
    transportCostPerUnit: 0.80,
    images: [`${BASE}/photo-1550258987-190a2d41a8ba${Q}`],
  },
];

const seedVouchers = [
  {
    _id: uuidv4(), code: 'FRESH10', type: 'percentage', value: 10,
    minOrderAmount: 0, maxUses: 100, usedCount: 0, expiresAt: '2027-12-31T23:59:59Z', isActive: true,
  },
  {
    _id: uuidv4(), code: 'FARM20', type: 'percentage', value: 20,
    minOrderAmount: 20, maxUses: 50, usedCount: 0, expiresAt: '2027-12-31T23:59:59Z', isActive: true,
  },
  {
    _id: uuidv4(), code: 'SAVE5', type: 'fixed', value: 5,
    minOrderAmount: 10, maxUses: 0, usedCount: 0, expiresAt: null, isActive: true,
  },
];

module.exports = async function seed() {
  const fruitCount = await Fruit.countDocuments();
  if (fruitCount === 0) {
    await Fruit.insertMany(seedFruits);
    console.log('✓ Seeded fruits');
  }
  const voucherCount = await Voucher.countDocuments();
  if (voucherCount === 0) {
    await Voucher.insertMany(seedVouchers);
    console.log('✓ Seeded vouchers');
  }
};
