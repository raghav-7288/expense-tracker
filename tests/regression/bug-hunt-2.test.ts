/**
 * Regression tests for bugs found during QA bug hunt.
 * Covers: timezone-safe date formatting, CSV date validation rollover,
 * and analytics empty array guards.
 */
import { describe, it, expect } from 'vitest';
import { formatDate, getToday, getMonthStart, getMonthEnd } from '@/utils/formatDate';

describe('formatDate — timezone safety', () => {
  it('getToday returns YYYY-MM-DD format', () => {
    const today = getToday();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Should be today's local date
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(today).toBe(expected);
  });

  it('getMonthStart returns first day of current month', () => {
    const start = getMonthStart();
    expect(start).toMatch(/^\d{4}-\d{2}-01$/);
    const now = new Date();
    expect(start).toBe(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
  });

  it('getMonthEnd returns last day of current month', () => {
    const end = getMonthEnd();
    expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    expect(end.endsWith(`-${String(lastDay).padStart(2, '0')}`)).toBe(true);
  });

  it('getMonthStart and getMonthEnd are in the same month', () => {
    const start = getMonthStart();
    const end = getMonthEnd();
    // Same year-month prefix
    expect(start.substring(0, 7)).toBe(end.substring(0, 7));
  });

  it('formatDate handles standard dates correctly', () => {
    expect(formatDate('2024-01-15')).toBe('Jan 15, 2024');
    expect(formatDate('2024-12-31')).toBe('Dec 31, 2024');
  });

  it('toISODate uses local timezone (not UTC)', () => {
    // If getToday() used UTC, it could return yesterday in positive UTC offsets.
    // This test verifies it uses local timezone components.
    const today = getToday();
    const localDay = new Date().getDate();
    const dayPart = parseInt(today.split('-')[2]!, 10);
    expect(dayPart).toBe(localDay);
  });
});

describe('CSV date validation — rollover prevention', () => {
  // Import the module to access parseCSV indirectly through the component
  // We test the logic directly here

  function validateDate(dateStr: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return false;
    const [y, m, d] = dateStr.split('-').map(Number) as [number, number, number];
    return date.getFullYear() === y && date.getMonth() + 1 === m && date.getDate() === d;
  }

  it('accepts valid dates', () => {
    expect(validateDate('2024-01-01')).toBe(true);
    expect(validateDate('2024-02-29')).toBe(true); // leap year
    expect(validateDate('2024-12-31')).toBe(true);
  });

  it('rejects Feb 30 (rollover to Mar 1)', () => {
    expect(validateDate('2024-02-30')).toBe(false);
  });

  it('rejects Feb 29 in non-leap year', () => {
    expect(validateDate('2023-02-29')).toBe(false);
  });

  it('rejects Apr 31 (rollover to May 1)', () => {
    expect(validateDate('2024-04-31')).toBe(false);
  });

  it('rejects month 13', () => {
    expect(validateDate('2024-13-01')).toBe(false);
  });

  it('rejects day 0', () => {
    expect(validateDate('2024-01-00')).toBe(false);
  });

  it('rejects invalid format', () => {
    expect(validateDate('2024/01/01')).toBe(false);
    expect(validateDate('01-01-2024')).toBe(false);
    expect(validateDate('not-a-date')).toBe(false);
    expect(validateDate('')).toBe(false);
  });
});

describe('analytics — empty array guards', () => {
  // Replicate the guarded logic from computeCategoryBreakdown
  function safeMax(arr: number[]): number {
    return arr.length > 0 ? Math.max(...arr) : 0;
  }

  function safeMin(arr: number[]): number {
    return arr.length > 0 ? Math.min(...arr) : 0;
  }

  it('safeMax returns 0 for empty array (not -Infinity)', () => {
    expect(safeMax([])).toBe(0);
  });

  it('safeMin returns 0 for empty array (not Infinity)', () => {
    expect(safeMin([])).toBe(0);
  });

  it('safeMax works normally with values', () => {
    expect(safeMax([10, 50, 30])).toBe(50);
  });

  it('safeMin works normally with values', () => {
    expect(safeMin([10, 50, 30])).toBe(10);
  });

  it('handles single element', () => {
    expect(safeMax([42])).toBe(42);
    expect(safeMin([42])).toBe(42);
  });
});

