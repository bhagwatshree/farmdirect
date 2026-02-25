const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
const Fruit = require('../models/Fruit');
const Voucher = require('../models/Voucher');
const authenticate = require('../middleware/auth');
const { notifyOrderCreated, notifyStatusChanged } = require('../utils/notifications');

const router = express.Router();

// Helper: validate a voucher and calculate discount
async function validateVoucher(code, subtotal) {
  if (!code) return { discountAmount: 0 };

  const voucher = await Voucher.findOne({ code: code.toUpperCase() });
  if (!voucher) return { error: `Voucher code '${code}' not found` };
  if (!voucher.isActive) return { error: 'Voucher is no longer active' };
  if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) return { error: 'Voucher has expired' };
  if (voucher.maxUses > 0 && voucher.usedCount >= voucher.maxUses) return { error: 'Voucher has reached its usage limit' };
  if (voucher.minOrderAmount > 0 && subtotal < voucher.minOrderAmount) {
    return { error: `Minimum order amount of $${voucher.minOrderAmount.toFixed(2)} required` };
  }

  let discountAmount;
  if (voucher.type === 'percentage') {
    discountAmount = parseFloat(((subtotal * voucher.value) / 100).toFixed(2));
  } else {
    discountAmount = parseFloat(Math.min(voucher.value, subtotal).toFixed(2));
  }

  return { discountAmount, voucher };
}

// Customer: place order
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Customers only' });
    }

    const { items, billingAddress, deliveryAddress, voucherCode } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    const orderItems = [];
    let subtotal = 0;
    let transportCost = 0;

    for (const item of items) {
      const fruit = await Fruit.findById(item.fruitId);
      if (!fruit) return res.status(400).json({ message: `Fruit not found: ${item.fruitId}` });
      if (fruit.quantity < item.quantity) {
        return res.status(400).json({ message: `Only ${fruit.quantity} ${fruit.unit} available for ${fruit.name}` });
      }

      const itemSubtotal = parseFloat((fruit.price * item.quantity).toFixed(2));
      const itemTransport = parseFloat(((fruit.transportCostPerUnit || 0) * item.quantity).toFixed(2));

      await Fruit.findByIdAndUpdate(item.fruitId, { $inc: { quantity: -item.quantity } });

      orderItems.push({
        fruitId: fruit._id,
        fruitName: fruit.name,
        farmerId: fruit.farmerId,
        farmerName: fruit.farmerName,
        category: fruit.category,
        quantity: item.quantity,
        unit: fruit.unit,
        pricePerUnit: fruit.price,
        transportCostPerUnit: fruit.transportCostPerUnit || 0,
        subtotal: itemSubtotal,
      });

      subtotal += itemSubtotal;
      transportCost += itemTransport;
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    transportCost = parseFloat(transportCost.toFixed(2));

    const voucherResult = await validateVoucher(voucherCode, subtotal);
    if (voucherResult.error) {
      return res.status(400).json({ message: voucherResult.error });
    }

    const { discountAmount = 0, voucher } = voucherResult;
    const total = parseFloat(Math.max(0, subtotal + transportCost - discountAmount).toFixed(2));

    const order = new Order({
      _id: uuidv4(),
      customerId: req.user.id,
      customerName: req.user.name,
      billingAddress: billingAddress || {},
      deliveryAddress: deliveryAddress || billingAddress || {},
      items: orderItems,
      subtotal,
      transportCost,
      voucherCode: voucherCode ? voucherCode.toUpperCase() : null,
      discountAmount,
      total,
    });

    await order.save();

    if (voucher) {
      await Voucher.findByIdAndUpdate(voucher._id, { $inc: { usedCount: 1 } });
    }

    notifyOrderCreated(order).catch(err => console.error('[Notify] orderCreated:', err.message));

    res.status(201).json(order.toJSON());
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get orders (filtered by role)
router.get('/', authenticate, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'customer') {
      orders = await Order.find({ customerId: req.user.id }).sort({ createdAt: -1 }).lean();
    } else if (req.user.role === 'farmer') {
      orders = await Order.find({ 'items.farmerId': req.user.id }).sort({ createdAt: -1 }).lean();
    } else {
      orders = [];
    }
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Farmer: update order status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Farmers only' });

    const validStatuses = ['pending', 'confirmed', 'accepted', 'rejected', 'shipped', 'delivered'];
    if (!validStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    notifyStatusChanged(order, req.user).catch(err => console.error('[Notify] statusChanged:', err.message));

    res.json(order.toJSON());
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
