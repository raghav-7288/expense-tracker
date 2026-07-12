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

