// Shipping tier logic — mirrors frontend/src/utils/constants.js
// Keep these in sync if you change tiers.

const UNIT_WEIGHT_KG = {
  kg: 1,
  piece: 0.3,
  dozen: 1.2,
  box: 5,
  bunch: 0.5,
};

const TRANSPORT_TIERS = [
  { maxKg: 10,  cost: 30  },
  { maxKg: 30,  cost: 60  },
  { maxKg: 50,  cost: 100 },
  { maxKg: 100, cost: 150 },
];

function getCartWeightKg(items) {
  return items.reduce(
    (sum, item) => sum + item.quantity * (UNIT_WEIGHT_KG[item.unit] || 1),
    0
  );
}

function getShippingFee(totalWeightKg) {
  for (const tier of TRANSPORT_TIERS) {
    if (totalWeightKg <= tier.maxKg) return tier.cost;
  }
  return TRANSPORT_TIERS[TRANSPORT_TIERS.length - 1].cost;
}

module.exports = { UNIT_WEIGHT_KG, TRANSPORT_TIERS, getCartWeightKg, getShippingFee };
