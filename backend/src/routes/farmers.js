const express = require('express');
const User = require('../models/User');
const Fruit = require('../models/Fruit');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Public fields exposed on a farmer profile (never expose password / tokens)
const PUBLIC_FIELDS = 'name location phone farmName farmTagline farmStory farmImages farmingPractices certifications establishedYear farmSizeAcres createdAt';

// GET /api/farmers/:id  — public farmer profile
router.get('/:id', async (req, res) => {
  try {
    const farmer = await User.findById(req.params.id).select(PUBLIC_FIELDS).lean();
    if (!farmer || farmer.role === 'customer') {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    // Also fetch their active listings
    const listings = await Fruit.find({ farmerId: req.params.id, quantity: { $gt: 0 } })
      .select('name category price unit quantity images location transportCostPerUnit')
      .lean();

    res.json({ farmer, listings });
  } catch (err) {
    console.error('Get farmer profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/farmers/profile  — authenticated farmer updates their own profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Farmers only' });
    }

    const ALLOWED = ['farmName', 'farmTagline', 'farmStory', 'farmImages', 'farmingPractices', 'certifications', 'establishedYear', 'farmSizeAcres'];
    const update = {};
    for (const key of ALLOWED) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const updated = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select(PUBLIC_FIELDS).lean();
    res.json(updated);
  } catch (err) {
    console.error('Update farmer profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
