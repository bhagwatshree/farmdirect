const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Fruit = require('../models/Fruit');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Public: list all fruits
router.get('/', async (req, res) => {
  try {
    const { category, search, farmerId } = req.query;
    const filter = {};

    if (farmerId) {
      filter.farmerId = farmerId;
    } else {
      filter.quantity = { $gt: 0 };
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    let fruits = await Fruit.find(filter).lean();

    if (search) {
      const q = search.toLowerCase();
      fruits = fruits.filter(f =>
        f.name.toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q) ||
        (f.location || '').toLowerCase().includes(q) ||
        (f.farmerName || '').toLowerCase().includes(q)
      );
    }

    res.json(fruits.map(f => ({ ...f, id: f._id })));
  } catch (error) {
    console.error('Get fruits error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: single fruit
router.get('/:id', async (req, res) => {
  try {
    const fruit = await Fruit.findById(req.params.id).lean();
    if (!fruit) return res.status(404).json({ message: 'Not found' });
    res.json({ ...fruit, id: fruit._id });
  } catch (error) {
    console.error('Get fruit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Farmer: create listing
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Farmers only' });

    const { name, description, price, unit, quantity, location, category, images, transportCostPerUnit } = req.body;
    if (!name || !price || !quantity || !category) {
      return res.status(400).json({ message: 'name, price, quantity and category are required' });
    }

    const fruit = new Fruit({
      _id: uuidv4(),
      farmerId: req.user.id,
      farmerName: req.user.name,
      name,
      description: description || '',
      price: parseFloat(price),
      unit: unit || 'kg',
      quantity: parseInt(quantity),
      location: location || '',
      category,
      images: Array.isArray(images) ? images.filter(Boolean) : [],
      transportCostPerUnit: transportCostPerUnit !== undefined ? parseFloat(transportCostPerUnit) : 0,
    });

    await fruit.save();
    res.status(201).json(fruit.toJSON());
  } catch (error) {
    console.error('Create fruit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Farmer: update listing
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Farmers only' });

    const { name, description, price, unit, quantity, location, category, images, transportCostPerUnit } = req.body;

    const updates = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (unit !== undefined) updates.unit = unit;
    if (quantity !== undefined) updates.quantity = parseInt(quantity);
    if (location !== undefined) updates.location = location;
    if (category !== undefined) updates.category = category;
    if (Array.isArray(images)) updates.images = images.filter(Boolean);
    if (transportCostPerUnit !== undefined) updates.transportCostPerUnit = parseFloat(transportCostPerUnit);

    const fruit = await Fruit.findOneAndUpdate(
      { _id: req.params.id, farmerId: req.user.id },
      { $set: updates },
      { new: true }
    );

    if (!fruit) return res.status(404).json({ message: 'Not found or unauthorized' });
    res.json(fruit.toJSON());
  } catch (error) {
    console.error('Update fruit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Farmer: delete listing
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Farmers only' });

    const fruit = await Fruit.findOneAndDelete({ _id: req.params.id, farmerId: req.user.id });
    if (!fruit) return res.status(404).json({ message: 'Not found or unauthorized' });

    res.json({ message: 'Listing deleted' });
  } catch (error) {
    console.error('Delete fruit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
