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

// Helpers
export const getCategoryEmoji = (category) => CATEGORY_EMOJIS[category] || '🌽';
export const getCategoryColor = (category) => CATEGORY_COLORS[category] || '#37474f';
export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
export const formatPrice = (price, unit) => `${formatINR(price)}/${unit}`;
export const formatOrderId = (id) => `#${id.slice(0, 8).toUpperCase()}`;
