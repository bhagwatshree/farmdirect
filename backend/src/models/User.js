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

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['farmer', 'customer'], required: true },
    location: { type: String, default: '' },
    phone: { type: String, default: '' },
    billingAddress: { type: addressSchema, default: () => ({}) },
    deliveryAddress: { type: addressSchema, default: () => ({}) },
    createdAt: { type: Date, default: Date.now },
    loginAttempts:    { type: Number, default: 0 },
    locked:           { type: Boolean, default: false },
    resetToken:       { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
    chatOtp:          { type: String, default: null },
    chatOtpExpiry:    { type: Date,   default: null },
  },
  { _id: false }
);

module.exports = mongoose.model('User', userSchema);
