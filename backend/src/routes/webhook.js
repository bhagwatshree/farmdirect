const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Fruit = require('../models/Fruit');
const { notifyOrderCreated } = require('../utils/notifications');

const router = express.Router();

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Verify Razorpay webhook signature
function verifyWebhookSignature(rawBody, signature) {
  if (!WEBHOOK_SECRET) {
    console.warn('[Webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping signature verification');
    return true;
  }
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}

// Restore stock when a payment fails
async function restoreStock(order) {
  for (const item of order.items) {
    await Fruit.findByIdAndUpdate(item.fruitId, { $inc: { quantity: item.quantity } });
  }
}

// POST /api/webhook/razorpay
// Must receive raw body — registered before express.json() in app.js
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // Buffer (raw)

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[Webhook] Invalid signature — rejected');
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }

  const { event: eventName, payload } = event;
  console.log(`[Webhook] Received: ${eventName}`);

  try {
    switch (eventName) {

      // Payment authorized (card/netbanking — funds held but not yet captured)
      case 'payment.authorized': {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const order = await Order.findOne({ razorpayOrderId: payment.order_id });
        if (!order) { console.warn(`[Webhook] Order not found for Razorpay order: ${payment.order_id}`); break; }

        // Only update if still pending (don't overwrite if frontend already verified)
        if (order.status === 'payment_pending') {
          order.status = 'payment_authorized';
          order.razorpayPaymentId = payment.id;
          await order.save();
          console.log(`[Webhook] Order ${order._id} → payment_authorized`);

          // Auto-capture the payment
          try {
            await razorpay.payments.capture(payment.id, payment.amount, payment.currency);
            console.log(`[Webhook] Auto-captured payment ${payment.id}`);
          } catch (captureErr) {
            console.error(`[Webhook] Auto-capture failed for ${payment.id}:`, captureErr.message);
          }
        }
        break;
      }

      // Payment captured — money collected, order is paid
      case 'payment.captured': {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const order = await Order.findOne({ razorpayOrderId: payment.order_id });
        if (!order) { console.warn(`[Webhook] Order not found for Razorpay order: ${payment.order_id}`); break; }

        if (['payment_pending', 'payment_authorized'].includes(order.status)) {
          order.status = 'payment_complete';
          order.razorpayPaymentId = payment.id;
          order.paidAt = new Date(payment.created_at * 1000);
          await order.save();
          console.log(`[Webhook] Order ${order._id} → payment_complete`);

          notifyOrderCreated(order).catch(err =>
            console.error('[Webhook] Email notification failed:', err.message)
          );
        }
        break;
      }

      // Order fully paid (Razorpay fires this after capture too — idempotent handler)
      case 'order.paid': {
        const rzpOrder = payload.order?.entity;
        const payment  = payload.payment?.entity;
        if (!rzpOrder || !payment) break;

        const order = await Order.findOne({ razorpayOrderId: rzpOrder.id });
        if (!order) { console.warn(`[Webhook] Order not found for Razorpay order: ${rzpOrder.id}`); break; }

        if (['payment_pending', 'payment_authorized'].includes(order.status)) {
          order.status = 'payment_complete';
          order.razorpayPaymentId = payment.id;
          order.paidAt = new Date(payment.created_at * 1000);
          await order.save();
          console.log(`[Webhook] Order ${order._id} → payment_complete (order.paid)`);

          notifyOrderCreated(order).catch(err =>
            console.error('[Webhook] Email notification failed:', err.message)
          );
        }
        break;
      }

      // Payment failed — restore stock
      case 'payment.failed': {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const order = await Order.findOne({ razorpayOrderId: payment.order_id });
        if (!order) { console.warn(`[Webhook] Order not found for Razorpay order: ${payment.order_id}`); break; }

        if (order.status === 'payment_pending' || order.status === 'payment_authorized') {
          order.status = 'payment_failed';
          order.razorpayPaymentId = payment.id;
          await order.save();
          console.log(`[Webhook] Order ${order._id} → payment_failed`);

          // Restore reserved stock
          await restoreStock(order);
          console.log(`[Webhook] Stock restored for order ${order._id}`);
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${eventName}`);
    }
  } catch (err) {
    console.error(`[Webhook] Handler error for ${eventName}:`, err.message);
    return res.status(500).json({ message: 'Webhook processing error' });
  }

  // Always respond 200 to acknowledge receipt
  res.json({ received: true });
});

module.exports = router;
