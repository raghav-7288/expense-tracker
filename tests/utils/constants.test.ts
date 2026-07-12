import { describe, it, expect } from 'vitest';
import { CATEGORY_COLORS, CATEGORY_ICONS, CURRENCIES } from '@/utils/constants';

describe('constants', () => {
  describe('CATEGORY_COLORS', () => {
    it('has 16 colors', () => {
      expect(CATEGORY_COLORS).toHaveLength(16);
    });

    it('all are valid hex codes', () => {
      for (const color of CATEGORY_COLORS) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  describe('CATEGORY_ICONS', () => {
    it('has 20 icons', () => {
      expect(CATEGORY_ICONS).toHaveLength(20);
    });

    it('all are non-empty strings', () => {
      for (const icon of CATEGORY_ICONS) {
        expect(icon.length).toBeGreaterThan(0);
      }
    });
  });

  describe('CURRENCIES', () => {
    it('has 7 currency options', () => {
      expect(CURRENCIES).toHaveLength(7);
    });

    it('each has value and label', () => {
      for (const c of CURRENCIES) {
        expect(c.value).toBeTruthy();
        expect(c.label).toBeTruthy();
      }
    });

    it('includes USD', () => {
      expect(CURRENCIES.find((c) => c.value === 'USD')).toBeDefined();
    });

    it('includes INR', () => {
      expect(CURRENCIES.find((c) => c.value === 'INR')).toBeDefined();
    });
  });
});

