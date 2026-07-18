import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCompactCurrency } from '@/utils/formatCurrency';

describe('formatCurrency', () => {
  it('formats USD by default', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats negative amounts', () => {
    expect(formatCurrency(-100)).toBe('-$100.00');
  });

  it('formats EUR', () => {
    const result = formatCurrency(100, 'EUR');
    expect(result).toContain('100.00');
    expect(result).toContain('€');
  });

  it('formats GBP', () => {
    const result = formatCurrency(100, 'GBP');
    expect(result).toContain('100.00');
    expect(result).toContain('£');
  });

  it('formats INR', () => {
    const result = formatCurrency(100, 'INR');
    expect(result).toContain('₹');
  });

  it('formats JPY (no decimals for JPY in Intl)', () => {
    const result = formatCurrency(1000, 'JPY');
    expect(result).toContain('¥');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(10.999)).toBe('$11.00');
  });
});

describe('formatCompactCurrency', () => {
  it('returns standard format for amounts under 1M', () => {
    expect(formatCompactCurrency(999999)).toBe('$999,999.00');
  });

  it('returns compact format for amounts >= 1M', () => {
    const result = formatCompactCurrency(1500000);
    expect(result).toContain('$');
    expect(result).toMatch(/1\.5M|1,500/);
  });

  it('handles negative amounts >= 1M', () => {
    const result = formatCompactCurrency(-2000000);
    expect(result).toContain('-');
    expect(result).toContain('$');
  });

  it('uses correct currency for compact', () => {
    const result = formatCompactCurrency(5000000, 'EUR');
    expect(result).toContain('€');
  });

  it('formats small amounts the same as formatCurrency', () => {
    expect(formatCompactCurrency(42.5, 'USD')).toBe(formatCurrency(42.5, 'USD'));
  });
});

/* ============================================================
   MULTI-CURRENCY VERIFICATION
   Covers: INR, USD, EUR, GBP, JPY
   Verifies: symbols, thousands separators, decimal precision
   ============================================================ */

describe('multi-currency: formatCurrency', () => {
  const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY'] as const;
  const EXPECTED_SYMBOLS: Record<(typeof CURRENCIES)[number], string> = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
  };

  for (const currency of CURRENCIES) {
    describe(currency, () => {
      it(`includes the ${currency} symbol`, () => {
        const result = formatCurrency(1000, currency);
        expect(result).toContain(EXPECTED_SYMBOLS[currency]);
      });

      it('includes thousands separator for large amounts', () => {
        const result = formatCurrency(1234567, currency);
        expect(result).toContain(',');
      });

      it('formats zero correctly', () => {
        const result = formatCurrency(0, currency);
        expect(result).toContain(EXPECTED_SYMBOLS[currency]);
        expect(result).toContain('0');
      });

      it('handles negative amounts', () => {
        const result = formatCurrency(-500, currency);
        expect(result).toContain('-');
        expect(result).toContain(EXPECTED_SYMBOLS[currency]);
      });
    });
  }

  // Decimal precision per currency
  describe('decimal precision', () => {
    it('USD shows 2 decimal places', () => {
      expect(formatCurrency(100, 'USD')).toBe('$100.00');
    });

    it('INR shows 2 decimal places', () => {
      const result = formatCurrency(100, 'INR');
      expect(result).toMatch(/100\.00/);
    });

    it('EUR shows 2 decimal places', () => {
      const result = formatCurrency(100, 'EUR');
      expect(result).toMatch(/100\.00/);
    });

    it('GBP shows 2 decimal places', () => {
      const result = formatCurrency(100, 'GBP');
      expect(result).toMatch(/100\.00/);
    });

    it('JPY shows 0 decimal places', () => {
      const result = formatCurrency(100, 'JPY');
      expect(result).not.toContain('.');
    });

    it('JPY rounds to nearest integer', () => {
      const result = formatCurrency(99.7, 'JPY');
      expect(result).toContain('100');
      expect(result).not.toContain('.');
    });
  });

  // Thousands separators
  describe('thousands separators', () => {
    it('USD formats 1,234,567.89 correctly', () => {
      expect(formatCurrency(1234567.89, 'USD')).toBe('$1,234,567.89');
    });

    it('INR formats with commas', () => {
      const result = formatCurrency(1234567.89, 'INR');
      expect(result).toContain('₹');
      expect(result).toContain(',');
    });

    it('JPY formats 1,234,567 with commas and no decimals', () => {
      const result = formatCurrency(1234567, 'JPY');
      expect(result).toContain('¥');
      expect(result).toContain('1,234,567');
      expect(result).not.toContain('.');
    });
  });
});

describe('multi-currency: formatCompactCurrency', () => {
  const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY'] as const;
  const EXPECTED_SYMBOLS: Record<(typeof CURRENCIES)[number], string> = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
  };

  for (const currency of CURRENCIES) {
    it(`${currency}: compact format for >= 1M includes correct symbol`, () => {
      const result = formatCompactCurrency(5000000, currency);
      expect(result).toContain(EXPECTED_SYMBOLS[currency]);
    });

    it(`${currency}: falls back to formatCurrency for < 1M`, () => {
      const result = formatCompactCurrency(999, currency);
      expect(result).toBe(formatCurrency(999, currency));
    });
  }

  it('compact USD shows $1.5M', () => {
    expect(formatCompactCurrency(1500000, 'USD')).toMatch(/\$1\.5M/);
  });

  it('compact INR shows ₹1.5M', () => {
    expect(formatCompactCurrency(1500000, 'INR')).toMatch(/₹1\.5M/);
  });

  it('compact EUR shows €5M or €5.0M', () => {
    expect(formatCompactCurrency(5000000, 'EUR')).toMatch(/€5(\.0)?M/);
  });
});

