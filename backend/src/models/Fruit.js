const mongoose = require('mongoose');

const fruitSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    farmerId: { type: String, required: true },
    farmerName: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    quantity: { type: Number, required: true },
    location: { type: String, default: '' },
    category: { type: String, required: true },
    transportCostPerUnit: { type: Number, default: 0 },
    images: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

module.exports = mongoose.model('Fruit', fruitSchema);
