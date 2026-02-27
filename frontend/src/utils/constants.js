// Shared constants and helpers for FarmDirect

export const CATEGORY_EMOJIS = {
  Apple: '🍎', Mango: '🥭', Orange: '🍊', Berry: '🍓',
  Banana: '🍌', Grapes: '🍇', Peach: '🍑', Lemon: '🍋',
  Pineapple: '🍍', Melon: '🍈', Other: '🌽',
};

export const CATEGORY_COLORS = {
  Apple: '#c62828', Mango: '#e65100', Orange: '#ef6c00',
  Berry: '#ad1457', Banana: '#f9a825', Grapes: '#6a1b9a',
  Peach: '#ff7043', Lemon: '#827717', Pineapple: '#558b2f',
  Melon: '#2e7d32', Other: '#37474f',
};

// All fruit categories (includes 'Other', no 'All')
export const FRUIT_CATEGORIES = [
  'Apple', 'Mango', 'Orange', 'Berry', 'Banana',
  'Grapes', 'Peach', 'Lemon', 'Pineapple', 'Melon', 'Other',
];

// Categories for the listings browse filter (adds 'All' at start)
export const BROWSE_CATEGORIES = ['All', ...FRUIT_CATEGORIES];

export const UNITS = ['kg', 'piece', 'dozen', 'box', 'bunch'];

export const ORDER_STATUSES = ['payment_pending', 'payment_authorized', 'payment_captured', 'payment_complete', 'payment_failed', 'pending', 'confirmed', 'accepted', 'rejected', 'shipped', 'delivered', 'cancelled'];

export const STATUS_COLORS = {
  payment_pending:    'default',
  payment_authorized: 'warning',
  payment_captured:   'info',
  payment_complete:   'success',
  payment_failed:     'error',
  pending:            'warning',
  confirmed:          'info',
  accepted:           'info',
  rejected:           'error',
  shipped:            'primary',
  delivered:          'success',
  cancelled:          'error',
};

export const STATUS_LABELS = {
  payment_pending:    'Awaiting Payment',
  payment_authorized: 'Payment Authorised',
  payment_captured:   'Payment Captured',
  payment_complete:   'Payment Complete',
  payment_failed:     'Payment Failed',
  pending:            'Pending',
  confirmed:          'Confirmed',
  accepted:           'Accepted',
  rejected:           'Rejected',
  shipped:            'Shipped',
  delivered:          'Delivered',
  cancelled:          'Cancelled',
};

// ─── Transport / Shipping configuration ──────────────────────────────────────

// Approximate weight (kg) per 1 unit of each unit type — adjust as needed
export const UNIT_WEIGHT_KG = {
  kg:    1,
  piece: 0.3,
  dozen: 1.2,
  box:   5,
  bunch: 0.5,
};

// Maximum total cart weight allowed (kg)
export const MAX_ORDER_KG = 100;

// Tiered flat shipping fee — edit cost values here to reconfigure
export const TRANSPORT_TIERS = [
  { label: 'Up to 10 kg',  maxKg: 10,  cost: 30  },
  { label: '10 – 30 kg',   maxKg: 30,  cost: 60  },
  { label: '30 – 50 kg',   maxKg: 50,  cost: 100 },
  { label: '50 – 100 kg',  maxKg: 100, cost: 150 },
];

// Returns the flat shipping fee for a given total cart weight
export const getShippingFee = (totalWeightKg) => {
  for (const tier of TRANSPORT_TIERS) {
    if (totalWeightKg <= tier.maxKg) return tier.cost;
  }
  return TRANSPORT_TIERS[TRANSPORT_TIERS.length - 1].cost;
};

// Returns the matching tier label for display
export const getShippingTierLabel = (totalWeightKg) => {
  for (const tier of TRANSPORT_TIERS) {
    if (totalWeightKg <= tier.maxKg) return tier.label;
  }
  return TRANSPORT_TIERS[TRANSPORT_TIERS.length - 1].label;
};

// Calculates total estimated cart weight in kg
export const getCartWeightKg = (items) =>
  items.reduce((sum, item) => sum + item.qty * (UNIT_WEIGHT_KG[item.unit] ?? 1), 0);

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const getCategoryEmoji = (category) => CATEGORY_EMOJIS[category] || '🌽';
export const getCategoryColor = (category) => CATEGORY_COLORS[category] || '#37474f';
export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
export const formatPrice = (price, unit) => `${formatINR(price)}/${unit}`;
export const formatOrderId = (id) => `#${id.slice(0, 8).toUpperCase()}`;
