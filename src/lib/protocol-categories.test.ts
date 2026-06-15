import { describe, it, expect } from 'vitest';
import { PROTOCOL_CATEGORIES, categoryKeys, getCategory } from './protocol-categories';

describe('protocol categories registry', () => {
  it('defines six categories with unique keys', () => {
    expect(PROTOCOL_CATEGORIES).toHaveLength(6);
    expect(new Set(categoryKeys).size).toBe(6);
  });

  it('uses unique sequential order values', () => {
    const orders = PROTOCOL_CATEGORIES.map((c) => c.order).sort((a, b) => a - b);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('gives every category the required display fields', () => {
    for (const c of PROTOCOL_CATEGORIES) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.blurb.length).toBeGreaterThan(0);
      expect(c.color).toBeTruthy();
      expect(c.icon).toBeTruthy();
    }
  });

  it('looks categories up by key', () => {
    expect(getCategory('medications')?.label).toBe('Medications');
    expect(getCategory('not-a-category')).toBeUndefined();
  });

  it('includes the two new categories', () => {
    expect(categoryKeys).toContain('supplements');
    expect(categoryKeys).toContain('nutrition');
  });
});
