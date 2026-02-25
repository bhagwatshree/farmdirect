import {
  CATEGORY_EMOJIS,
  CATEGORY_COLORS,
  FRUIT_CATEGORIES,
  BROWSE_CATEGORIES,
  UNITS,
  ORDER_STATUSES,
  STATUS_COLORS,
  getCategoryEmoji,
  getCategoryColor,
  formatPrice,
  formatOrderId,
} from '../../utils/constants';

describe('CATEGORY_EMOJIS', () => {
  it('has the correct emoji for each main fruit', () => {
    expect(CATEGORY_EMOJIS.Apple).toBe('🍎');
    expect(CATEGORY_EMOJIS.Mango).toBe('🥭');
    expect(CATEGORY_EMOJIS.Orange).toBe('🍊');
    expect(CATEGORY_EMOJIS.Berry).toBe('🍓');
    expect(CATEGORY_EMOJIS.Banana).toBe('🍌');
    expect(CATEGORY_EMOJIS.Grapes).toBe('🍇');
    expect(CATEGORY_EMOJIS.Peach).toBe('🍑');
    expect(CATEGORY_EMOJIS.Lemon).toBe('🍋');
    expect(CATEGORY_EMOJIS.Pineapple).toBe('🍍');
    expect(CATEGORY_EMOJIS.Melon).toBe('🍈');
    expect(CATEGORY_EMOJIS.Other).toBe('🌽');
  });
});

describe('CATEGORY_COLORS', () => {
  it('has a hex color for each category', () => {
    Object.values(CATEGORY_COLORS).forEach(color => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('has the Apple color defined', () => {
    expect(CATEGORY_COLORS.Apple).toBe('#c62828');
  });
});

describe('FRUIT_CATEGORIES', () => {
  it('has 11 items', () => {
    expect(FRUIT_CATEGORIES).toHaveLength(11);
  });

  it('includes Other', () => {
    expect(FRUIT_CATEGORIES).toContain('Other');
  });

  it('does NOT include All', () => {
    expect(FRUIT_CATEGORIES).not.toContain('All');
  });

  it('contains standard fruit types', () => {
    ['Apple', 'Mango', 'Orange', 'Berry', 'Banana', 'Grapes'].forEach(c =>
      expect(FRUIT_CATEGORIES).toContain(c)
    );
  });
});

describe('BROWSE_CATEGORIES', () => {
  it('has 12 items (FRUIT_CATEGORIES + All)', () => {
    expect(BROWSE_CATEGORIES).toHaveLength(12);
  });

  it('starts with All', () => {
    expect(BROWSE_CATEGORIES[0]).toBe('All');
  });

  it('includes Other', () => {
    expect(BROWSE_CATEGORIES).toContain('Other');
  });
});

describe('UNITS', () => {
  it('contains standard units', () => {
    expect(UNITS).toContain('kg');
    expect(UNITS).toContain('piece');
    expect(UNITS).toContain('dozen');
    expect(UNITS).toContain('box');
    expect(UNITS).toContain('bunch');
  });
});

describe('ORDER_STATUSES', () => {
  it('has exactly the four order statuses in order', () => {
    expect(ORDER_STATUSES).toEqual(['pending', 'confirmed', 'shipped', 'delivered']);
  });
});

describe('STATUS_COLORS', () => {
  it('maps each status to a MUI color variant', () => {
    expect(STATUS_COLORS.pending).toBe('warning');
    expect(STATUS_COLORS.confirmed).toBe('info');
    expect(STATUS_COLORS.shipped).toBe('primary');
    expect(STATUS_COLORS.delivered).toBe('success');
  });
});

describe('getCategoryEmoji', () => {
  it('returns the correct emoji for a known category', () => {
    expect(getCategoryEmoji('Apple')).toBe('🍎');
    expect(getCategoryEmoji('Mango')).toBe('🥭');
    expect(getCategoryEmoji('Other')).toBe('🌽');
  });

  it('returns the fallback 🌽 for an unknown category', () => {
    expect(getCategoryEmoji('Unknown')).toBe('🌽');
  });

  it('returns the fallback 🌽 for undefined input', () => {
    expect(getCategoryEmoji(undefined)).toBe('🌽');
  });
});

describe('getCategoryColor', () => {
  it('returns the correct hex color for a known category', () => {
    expect(getCategoryColor('Apple')).toBe('#c62828');
    expect(getCategoryColor('Grapes')).toBe('#6a1b9a');
  });

  it('returns the fallback color #37474f for an unknown category', () => {
    expect(getCategoryColor('Unknown')).toBe('#37474f');
    expect(getCategoryColor(undefined)).toBe('#37474f');
  });
});

describe('formatPrice', () => {
  it('formats an integer price with two decimal places and unit', () => {
    expect(formatPrice(10, 'kg')).toBe('$10.00/kg');
  });

  it('formats a decimal price correctly', () => {
    expect(formatPrice(2.5, 'piece')).toBe('$2.50/piece');
  });

  it('formats a string price (coerces to number)', () => {
    expect(formatPrice('3', 'dozen')).toBe('$3.00/dozen');
  });
});

describe('formatOrderId', () => {
  it('returns # followed by first 8 characters in uppercase', () => {
    expect(formatOrderId('abcdef1234567890')).toBe('#ABCDEF12');
  });

  it('handles a UUID-style id', () => {
    const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    expect(formatOrderId(id)).toBe('#A1B2C3D4');
  });
});
