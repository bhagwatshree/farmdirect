const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    fruitId: { type: String, required: true },
    fruitName: { type: String, required: true },
    farmerId: { type: String, required: true },
    farmerName: { type: String, required: true },
    category: { type: String, default: '' },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    pricePerUnit: { type: Number, required: true },
    transportCostPerUnit: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    billingAddress: { type: addressSchema, default: () => ({}) },
    deliveryAddress: { type: addressSchema, default: () => ({}) },
    items: [orderItemSchema],
    itemStatuses: [
      {
        _id: false,
        farmerId: { type: String, required: true },
        farmerName: { type: String, required: true },
        status: {
          type: String,
          enum: ['payment_pending', 'payment_authorized', 'payment_captured', 'payment_complete', 'payment_failed', 'pending', 'confirmed', 'accepted', 'rejected', 'shipped', 'delivered', 'cancelled'],
          default: 'payment_pending',
        },
        estimatedDelivery: { type: Date, default: null },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    transportCost: { type: Number, default: 0 },
    shippingPayment: { type: String, enum: ['online', 'cod'], default: 'online' },
    codAmount: { type: Number, default: 0 },
    voucherCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['payment_pending', 'payment_authorized', 'payment_captured', 'payment_complete', 'payment_failed', 'pending', 'confirmed', 'accepted', 'rejected', 'shipped', 'delivered', 'cancelled'],
      default: 'payment_pending',
    },
    razorpayOrderId:   { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    paidAt:            { type: Date,   default: null },
    estimatedDelivery: { type: Date,   default: null },
    cancelledAt:       { type: Date,   default: null },
    transactions: [
      {
        _id: false,
        type:       { type: String, enum: ['payment', 'refund'] },
        amount:     { type: Number },
        razorpayId: { type: String },
        status:     { type: String },
        note:       { type: String, default: '' },
        createdAt:  { type: Date, default: Date.now },
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

module.exports = mongoose.model('Order', orderSchema);
