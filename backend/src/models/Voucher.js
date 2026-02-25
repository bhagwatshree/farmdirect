const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxUses: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

module.exports = mongoose.model('Voucher', voucherSchema);
