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

export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered'];

export const STATUS_COLORS = {
  pending: 'warning', confirmed: 'info', shipped: 'primary', delivered: 'success',
};

// Helpers
export const getCategoryEmoji = (category) => CATEGORY_EMOJIS[category] || '🌽';
export const getCategoryColor = (category) => CATEGORY_COLORS[category] || '#37474f';
export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
export const formatPrice = (price, unit) => `${formatINR(price)}/${unit}`;
export const formatOrderId = (id) => `#${id.slice(0, 8).toUpperCase()}`;
