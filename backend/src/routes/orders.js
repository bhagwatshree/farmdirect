const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Fruit = require('../models/Fruit');
const Voucher = require('../models/Voucher');
const authenticate = require('../middleware/auth');
const { notifyOrderCreated, notifyStatusChanged } = require('../utils/notifications');
const { getCartWeightKg, getShippingFee } = require('../utils/shipping');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

    const { items, billingAddress, deliveryAddress, voucherCode, shippingPayment } = req.body;
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

    // Compute shipping fee server-side from actual item weights (don't trust client)
    const totalWeightKg = getCartWeightKg(orderItems);
    const shippingFee = orderItems.length > 0 ? getShippingFee(totalWeightKg) : 0;
    const shippingCosts = parseFloat((shippingFee + transportCost).toFixed(2));
    const total = parseFloat(Math.max(0, subtotal + shippingCosts - discountAmount).toFixed(2));
    const isShippingCod = shippingPayment === 'cod';
    const codAmount = isShippingCod ? shippingCosts : 0;

    // Build per-farmer status entries
    const farmerMap = {};
    for (const oi of orderItems) {
      if (!farmerMap[oi.farmerId]) {
        farmerMap[oi.farmerId] = { farmerId: oi.farmerId, farmerName: oi.farmerName };
      }
    }
    const itemStatuses = Object.values(farmerMap).map(f => ({
      farmerId: f.farmerId,
      farmerName: f.farmerName,
      status: 'pending',
    }));

    const order = new Order({
      _id: uuidv4(),
      customerId: req.user.id,
      customerName: req.user.name,
      billingAddress: billingAddress || {},
      deliveryAddress: deliveryAddress || billingAddress || {},
      items: orderItems,
      itemStatuses,
      subtotal,
      shippingFee,
      transportCost,
      shippingPayment: isShippingCod ? 'cod' : 'online',
      codAmount,
      voucherCode: voucherCode ? voucherCode.toUpperCase() : null,
      discountAmount,
      total,
      status: 'pending',
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

// Get single order by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = req.user.role === 'customer' && order.customerId === req.user.id;
    const isFarmer = req.user.role === 'farmer' && order.items.some(i => i.farmerId === req.user.id);
    if (!isOwner && !isFarmer) return res.status(403).json({ message: 'Forbidden' });

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper: derive top-level order status from per-farmer itemStatuses
function deriveOrderStatus(itemStatuses) {
  if (!itemStatuses || itemStatuses.length === 0) return 'pending';

  const statuses = itemStatuses.map(s => s.status);

  // If all farmers have the same status, use that
  if (statuses.every(s => s === statuses[0])) return statuses[0];

  // Priority order for deriving aggregate status (lowest progress wins)
  const priority = [
    'payment_pending', 'payment_authorized', 'payment_captured', 'payment_failed',
    'payment_complete', 'pending', 'confirmed', 'accepted', 'rejected',
    'shipped', 'delivered', 'cancelled',
  ];

  // If any farmer rejected, show rejected
  if (statuses.includes('rejected')) return 'rejected';
  // If any farmer cancelled, show cancelled
  if (statuses.includes('cancelled')) return 'cancelled';
  // If any payment failure, show that
  if (statuses.includes('payment_failed')) return 'payment_failed';

  // Otherwise use the least-progressed fulfillment status
  let minIdx = priority.length;
  for (const s of statuses) {
    const idx = priority.indexOf(s);
    if (idx >= 0 && idx < minIdx) minIdx = idx;
  }
  return priority[minIdx] || 'pending';
}

// Farmer: update order status (optionally set estimatedDelivery)
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Farmers only' });

    const validStatuses = ['confirmed', 'accepted', 'rejected', 'shipped', 'delivered'];
    if (!validStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Update the farmer's entry in itemStatuses
    const farmerEntry = order.itemStatuses.find(s => s.farmerId === req.user.id);
    if (!farmerEntry) {
      return res.status(403).json({ message: 'You have no items in this order' });
    }

    farmerEntry.status = req.body.status;
    farmerEntry.updatedAt = new Date();
    if (req.body.estimatedDelivery) {
      farmerEntry.estimatedDelivery = new Date(req.body.estimatedDelivery);
    }

    // Derive top-level status from all farmer sub-statuses
    order.status = deriveOrderStatus(order.itemStatuses);

    // Also set top-level estimatedDelivery to the latest among all farmers
    const allDeliveryDates = order.itemStatuses
      .map(s => s.estimatedDelivery)
      .filter(Boolean);
    if (allDeliveryDates.length > 0) {
      order.estimatedDelivery = new Date(Math.max(...allDeliveryDates.map(d => d.getTime())));
    }

    await order.save();

    notifyStatusChanged(order, req.user).catch(err => console.error('[Notify] statusChanged:', err.message));

    res.json(order.toJSON());
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Customer: cancel order (with Razorpay refund if already paid)
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'customer') return res.status(403).json({ message: 'Customers only' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.customerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const cancellableStatuses = ['payment_pending', 'payment_complete', 'pending', 'confirmed', 'accepted'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ message: `Cannot cancel an order with status '${order.status}'` });
    }

    // Restore stock
    for (const item of order.items) {
      await Fruit.findByIdAndUpdate(item.fruitId, { $inc: { quantity: item.quantity } });
    }

    const updateFields = { status: 'cancelled', cancelledAt: new Date() };
    let refundId = null;

    // Initiate Razorpay refund if payment was captured
    const refundableStatuses = ['payment_complete', 'pending', 'confirmed', 'accepted'];
    if (refundableStatuses.includes(order.status) && order.razorpayPaymentId) {
      try {
        const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
          amount: Math.round(order.total * 100),
          notes: { reason: 'Customer cancellation' },
        });
        refundId = refund.id;
        updateFields.$push = {
          transactions: {
            type: 'refund',
            amount: order.total,
            razorpayId: refund.id,
            status: refund.status || 'initiated',
            note: 'Customer cancellation refund',
          },
        };
      } catch (refundErr) {
        console.error('[Refund] Razorpay refund error:', refundErr.message);
        return res.status(502).json({ message: 'Refund initiation failed. Please contact support.' });
      }
    }

    const updated = await Order.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    res.json({ message: 'Order cancelled', refundId, order: updated.toJSON() });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
