const express = require('express');
const NotificationTemplate = require('../models/NotificationTemplate');
const authenticate = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications/templates — farmer retrieves their templates (creates defaults if missing)
router.get('/templates', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Farmers only' });

    let tpl = await NotificationTemplate.findById(req.user.id);
    if (!tpl) {
      tpl = await NotificationTemplate.create({ _id: req.user.id });
    }
    res.json(tpl.toJSON());
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/notifications/templates — farmer updates their templates
router.put('/templates', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Farmers only' });

    const { orderCreated, statusChanged } = req.body;

    const update = {};
    if (orderCreated?.customerEmail?.subject !== undefined) {
      update['orderCreated.customerEmail.subject'] = orderCreated.customerEmail.subject;
    }
    if (orderCreated?.customerEmail?.html !== undefined) {
      update['orderCreated.customerEmail.html'] = orderCreated.customerEmail.html;
    }
    if (orderCreated?.farmerEmail?.subject !== undefined) {
      update['orderCreated.farmerEmail.subject'] = orderCreated.farmerEmail.subject;
    }
    if (orderCreated?.farmerEmail?.html !== undefined) {
      update['orderCreated.farmerEmail.html'] = orderCreated.farmerEmail.html;
    }
    if (statusChanged?.customerEmail?.subject !== undefined) {
      update['statusChanged.customerEmail.subject'] = statusChanged.customerEmail.subject;
    }
    if (statusChanged?.customerEmail?.html !== undefined) {
      update['statusChanged.customerEmail.html'] = statusChanged.customerEmail.html;
    }

    const tpl = await NotificationTemplate.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, upsert: true }
    );

    res.json(tpl.toJSON());
  } catch (error) {
    console.error('Update templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/notifications/templates — reset to defaults
router.delete('/templates', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Farmers only' });

    await NotificationTemplate.findByIdAndDelete(req.user.id);
    const tpl = await NotificationTemplate.create({ _id: req.user.id });
    res.json(tpl.toJSON());
  } catch (error) {
    console.error('Reset templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
