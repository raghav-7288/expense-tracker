import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDate, formatDateShort, getToday, getMonthStart, getMonthEnd, getMonthName, getWeekStart, getWeekEnd } from '@/utils/formatDate';

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

describe('getWeekStart', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns Monday when today is Monday', () => {
    // Aug 5, 2026 is a Wednesday — let's pick a Monday: Aug 3, 2026
    vi.setSystemTime(new Date(2026, 7, 3, 12, 0, 0)); // Monday
    expect(getWeekStart()).toBe('2026-08-03');
  });

  it('returns previous Monday when today is Wednesday', () => {
    vi.setSystemTime(new Date(2026, 7, 5, 12, 0, 0)); // Wednesday
    expect(getWeekStart()).toBe('2026-08-03');
  });

  it('returns previous Monday when today is Sunday', () => {
    vi.setSystemTime(new Date(2026, 7, 9, 12, 0, 0)); // Sunday
    expect(getWeekStart()).toBe('2026-08-03');
  });

  it('returns previous Monday when today is Saturday', () => {
    vi.setSystemTime(new Date(2026, 7, 8, 12, 0, 0)); // Saturday
    expect(getWeekStart()).toBe('2026-08-03');
  });

  it('handles week spanning month boundary', () => {
    vi.setSystemTime(new Date(2026, 8, 2, 12, 0, 0)); // Sep 2 is a Wednesday
    expect(getWeekStart()).toBe('2026-08-31');
  });
});

describe('getWeekEnd', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns Sunday when today is Sunday', () => {
    vi.setSystemTime(new Date(2026, 7, 9, 12, 0, 0)); // Sunday
    expect(getWeekEnd()).toBe('2026-08-09');
  });

  it('returns next Sunday when today is Monday', () => {
    vi.setSystemTime(new Date(2026, 7, 3, 12, 0, 0)); // Monday
    expect(getWeekEnd()).toBe('2026-08-09');
  });

  it('returns next Sunday when today is Wednesday', () => {
    vi.setSystemTime(new Date(2026, 7, 5, 12, 0, 0)); // Wednesday
    expect(getWeekEnd()).toBe('2026-08-09');
  });

  it('week end is always >= week start', () => {
    vi.setSystemTime(new Date(2026, 7, 5, 12, 0, 0));
    expect(getWeekEnd() >= getWeekStart()).toBe(true);
  });

  it('week is always 6 days apart (Mon to Sun)', () => {
    vi.setSystemTime(new Date(2026, 7, 5, 12, 0, 0));
    const start = new Date(getWeekStart() + 'T00:00:00');
    const end = new Date(getWeekEnd() + 'T00:00:00');
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(6);
  });
});




