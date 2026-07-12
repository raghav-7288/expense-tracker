import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDate, formatDateShort, getToday, getMonthStart, getMonthEnd, getMonthName } from '@/utils/formatDate';

describe('formatDate', () => {
  it('formats a standard date string', () => {
    expect(formatDate('2024-06-15')).toBe('Jun 15, 2024');
  });

  it('formats January 1st', () => {
    expect(formatDate('2024-01-01')).toBe('Jan 1, 2024');
  });

  it('formats December 31st', () => {
    expect(formatDate('2024-12-31')).toBe('Dec 31, 2024');
  });
});

describe('formatDateShort', () => {
  it('formats without year', () => {
    expect(formatDateShort('2024-06-15')).toBe('Jun 15');
  });

  it('formats January 1st', () => {
    expect(formatDateShort('2024-01-01')).toBe('Jan 1');
  });
});

describe('getToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns today in YYYY-MM-DD format', () => {
    vi.setSystemTime(new Date('2024-07-04T12:00:00Z'));
    expect(getToday()).toBe('2024-07-04');
  });
});

describe('getMonthStart', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a valid YYYY-MM-DD date string', () => {
    vi.setSystemTime(new Date(2024, 5, 15, 12, 0, 0));
    const result = getMonthStart();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns consistent results for same month', () => {
    vi.setSystemTime(new Date(2024, 5, 1, 12, 0, 0));
    const earlyMonth = getMonthStart();
    vi.setSystemTime(new Date(2024, 5, 28, 12, 0, 0));
    const lateMonth = getMonthStart();
    expect(earlyMonth).toBe(lateMonth);
  });
});

describe('getMonthEnd', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a valid YYYY-MM-DD date string', () => {
    vi.setSystemTime(new Date(2024, 5, 15, 12, 0, 0));
    const result = getMonthEnd();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('month end is always after month start', () => {
    vi.setSystemTime(new Date(2024, 11, 5, 12, 0, 0));
    const start = getMonthStart();
    const end = getMonthEnd();
    expect(end > start).toBe(true);
  });

  it('returns consistent results for same month', () => {
    vi.setSystemTime(new Date(2024, 1, 3, 12, 0, 0));
    const earlyMonth = getMonthEnd();
    vi.setSystemTime(new Date(2024, 1, 20, 12, 0, 0));
    const lateMonth = getMonthEnd();
    expect(earlyMonth).toBe(lateMonth);
  });
});

describe('getMonthName', () => {
  it('returns short month name for a date string', () => {
    expect(getMonthName('2024-01-01')).toBe('Jan');
  });

  it('returns Jun for June', () => {
    expect(getMonthName('2024-06-01')).toBe('Jun');
  });

  it('returns Dec for December', () => {
    expect(getMonthName('2024-12-01')).toBe('Dec');
  });
});




