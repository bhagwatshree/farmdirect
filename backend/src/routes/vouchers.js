const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Voucher = require('../models/Voucher');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Authenticated: validate a voucher code — must be defined BEFORE GET / and POST /
router.post('/validate', authenticate, async (req, res) => {
  try {
    const { code, subtotal = 0 } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'code is required' });
    }

    const voucher = await Voucher.findOne({ code: code.toUpperCase() });
    if (!voucher) {
      return res.status(404).json({ valid: false, message: 'Voucher code not found' });
    }
    if (!voucher.isActive) {
      return res.status(400).json({ valid: false, message: 'Voucher is no longer active' });
    }
    if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
      return res.status(400).json({ valid: false, message: 'Voucher has expired' });
    }
    if (voucher.maxUses > 0 && voucher.usedCount >= voucher.maxUses) {
      return res.status(400).json({ valid: false, message: 'Voucher has reached its usage limit' });
    }

    const sub = parseFloat(subtotal) || 0;
    if (voucher.minOrderAmount > 0 && sub < voucher.minOrderAmount) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order amount of $${voucher.minOrderAmount.toFixed(2)} required`,
      });
    }

    let discountAmount;
    if (voucher.type === 'percentage') {
      discountAmount = parseFloat(((sub * voucher.value) / 100).toFixed(2));
    } else {
      discountAmount = parseFloat(Math.min(voucher.value, sub).toFixed(2));
    }

    res.json({
      valid: true,
      code: voucher.code,
      type: voucher.type,
      value: voucher.value,
      discountAmount,
      message: `Voucher applied! You save $${discountAmount.toFixed(2)}`,
    });
  } catch (error) {
    console.error('Validate voucher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Authenticated: list all active vouchers
router.get('/', authenticate, async (req, res) => {
  try {
    const active = await Voucher.find({ isActive: true }).lean();
    res.json(active);
  } catch (error) {
    console.error('Get vouchers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Authenticated: create a new voucher
router.post('/', authenticate, async (req, res) => {
  try {
    const { code, type, value, minOrderAmount, maxUses, expiresAt } = req.body;

    if (!code || !type || value === undefined) {
      return res.status(400).json({ message: 'code, type and value are required' });
    }
    if (!['percentage', 'fixed'].includes(type)) {
      return res.status(400).json({ message: 'type must be "percentage" or "fixed"' });
    }
    if (parseFloat(value) <= 0) {
      return res.status(400).json({ message: 'value must be greater than 0' });
    }
    if (type === 'percentage' && parseFloat(value) > 100) {
      return res.status(400).json({ message: 'percentage value cannot exceed 100' });
    }

    const existing = await Voucher.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(409).json({ message: 'Voucher code already exists' });
    }

    const voucher = new Voucher({
      _id: uuidv4(),
      code: code.toUpperCase(),
      type,
      value: parseFloat(value),
      minOrderAmount: minOrderAmount !== undefined ? parseFloat(minOrderAmount) : 0,
      maxUses: maxUses !== undefined ? parseInt(maxUses) : 0,
      expiresAt: expiresAt || null,
    });

    await voucher.save();
    res.status(201).json(voucher.toJSON());
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
