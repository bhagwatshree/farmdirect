const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
const Fruit = require('../models/Fruit');
const Voucher = require('../models/Voucher');
const authenticate = require('../middleware/auth');
const { notifyOrderCreated } = require('../utils/notifications');
const { getCartWeightKg, getShippingFee } = require('../utils/shipping');

const router = express.Router();

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper: validate voucher (mirrors orders.js)
async function validateVoucher(code, subtotal) {
  if (!code) return { discountAmount: 0 };
  const voucher = await Voucher.findOne({ code: code.toUpperCase() });
  if (!voucher) return { error: `Voucher code '${code}' not found` };
  if (!voucher.isActive) return { error: 'Voucher is no longer active' };
  if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) return { error: 'Voucher has expired' };
  if (voucher.maxUses > 0 && voucher.usedCount >= voucher.maxUses) return { error: 'Voucher has reached its usage limit' };
  if (voucher.minOrderAmount > 0 && subtotal < voucher.minOrderAmount) {
    return { error: `Minimum order amount of ₹${voucher.minOrderAmount.toFixed(2)} required` };
  }
  let discountAmount;
  if (voucher.type === 'percentage') {
    discountAmount = parseFloat(((subtotal * voucher.value) / 100).toFixed(2));
  } else {
    discountAmount = parseFloat(Math.min(voucher.value, subtotal).toFixed(2));
  }
  return { discountAmount, voucher };
}

// POST /api/payment/create-order
// Creates DB order (payment_pending) + Razorpay order, returns checkout details
router.post('/create-order', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Customers only' });
    }

    const { items, billingAddress, deliveryAddress, voucherCode, shippingPayment } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    // Build order items and calculate totals
    const orderItems = [];
    let subtotal = 0;
    let transportCost = 0;

    for (const item of items) {
      const fruit = await Fruit.findById(item.fruitId);
      if (!fruit) return res.status(400).json({ message: `Fruit not found: ${item.fruitId}` });
      if (fruit.quantity < item.quantity) {
        return res.status(400).json({
          message: `Only ${fruit.quantity} ${fruit.unit} available for ${fruit.name}`,
        });
      }

      const itemSubtotal = parseFloat((fruit.price * item.quantity).toFixed(2));
      const itemTransport = parseFloat(((fruit.transportCostPerUnit || 0) * item.quantity).toFixed(2));

      // Reserve stock immediately to prevent overselling
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
      // Restore stock if voucher fails
      for (const item of items) {
        await Fruit.findByIdAndUpdate(item.fruitId, { $inc: { quantity: item.quantity } });
      }
      return res.status(400).json({ message: voucherResult.error });
    }

    const { discountAmount = 0, voucher } = voucherResult;

    // Compute shipping fee server-side from actual item weights (don't trust client)
    const totalWeightKg = getCartWeightKg(orderItems);
    const shippingFee = orderItems.length > 0 ? getShippingFee(totalWeightKg) : 0;
    const shippingCosts = parseFloat((shippingFee + transportCost).toFixed(2));
    const total = parseFloat(Math.max(0, subtotal + shippingCosts - discountAmount).toFixed(2));

    // Determine online vs COD split for shipping
    const isShippingCod = shippingPayment === 'cod';
    const codAmount = isShippingCod ? shippingCosts : 0;
    const onlineAmount = parseFloat(Math.max(0, total - codAmount).toFixed(2));

    // Create Razorpay order (amount in paise — only the online portion)
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(onlineAmount * 100), // paise
      currency: 'INR',
      receipt: uuidv4(),
    });

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
      status: 'payment_pending',
    }));

    // Save DB order with payment_pending status
    const orderId = uuidv4();
    const order = new Order({
      _id: orderId,
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
      status: 'payment_pending',
      razorpayOrderId: rzpOrder.id,
    });

    await order.save();

    if (voucher) {
      await Voucher.findByIdAndUpdate(voucher._id, { $inc: { usedCount: 1 } });
    }

    res.status(201).json({
      orderId: order._id,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      customerName: req.user.name,
      customerEmail: req.user.email,
    });
  } catch (error) {
    console.error('Payment create-order error:', error);
    res.status(500).json({ message: 'Could not initiate payment. Please try again.' });
  }
});

// POST /api/payment/verify
// Verifies Razorpay signature, marks order as payment_complete
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Verify HMAC signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = 'payment_complete';
    order.razorpayPaymentId = razorpayPaymentId;
    order.paidAt = new Date();
    order.transactions.push({
      type: 'payment',
      amount: order.total,
      razorpayId: razorpayPaymentId,
      status: 'captured',
    });

    // Sync per-farmer sub-statuses
    if (order.itemStatuses && order.itemStatuses.length > 0) {
      for (const entry of order.itemStatuses) {
        entry.status = 'payment_complete';
        entry.updatedAt = new Date();
      }
    }

    await order.save();

    notifyOrderCreated(order).catch(err => console.error('[Notify] orderCreated:', err.message));

    res.json({ message: 'Payment verified successfully', order: order.toJSON() });
  } catch (error) {
    console.error('Payment verify error:', error);
    res.status(500).json({ message: 'Payment verification failed. Please contact support.' });
  }
});

// POST /api/payment/callback
// Handles Razorpay browser redirect for payment methods that can't use the JS handler
// (some UPI flows, netbanking). Razorpay POSTs form data here after payment.
router.post('/callback', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.redirect('/?payment=failed');
    }

    // Verify HMAC signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.redirect('/?payment=failed');
    }

    // Find order by Razorpay order ID (no JWT here — redirect flow)
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { status: 'payment_complete', razorpayPaymentId: razorpay_payment_id, paidAt: new Date() },
      { new: true }
    );

    if (order) {
      notifyOrderCreated(order).catch(err => console.error('[Notify] callback orderCreated:', err.message));
    }

    res.redirect('/orders?payment=success');
  } catch (error) {
    console.error('Payment callback error:', error);
    res.redirect('/?payment=failed');
  }
});

module.exports = router;
