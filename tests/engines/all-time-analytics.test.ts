/**
 * "All Time" filter — Analytics Engine Integration Tests
 *
 * Verifies that selecting the "All Time" preset:
 *  - removes every date restriction (no transaction is dropped by the range),
 *  - bounds the range tightly to the real data span (getAllTimeRange),
 *  - flows correctly through the entire analytics pipeline
 *    (summary, series, category breakdown, insights, rankings, reports),
 *  - composes with account + category filters,
 *  - handles the empty / single / large dataset edge cases.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAllTimeRange,
  getDateRange,
  filterTransactions,
  computeSummary,
  computeDailySeries,
  computeMonthlySeries,
  computeCategoryBreakdown,
  computeMonthlyReport,
  computeYearlyReport,
  getTransactionRankings,
  generateInsights,
} from '@/engines/analytics';
import type { Transaction } from '@/types';

// ── Helpers ──────────────────────────────────────────────

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'txn-1',
    user_id: 'u1',
    category_id: 'cat-food',
    account_id: 'acc-1',
    type: 'expense',
    amount: 100,
    notes: 'Test',
    date: '2022-06-15',
    created_at: '2022-06-15T10:00:00Z',
    updated_at: '2022-06-15T10:00:00Z',
    categories: {
      id: 'cat-food', user_id: 'u1', name: 'Food', type: 'expense',
      color: '#ef4444', icon: 'utensils', created_at: '', updated_at: '',
    },
    ...overrides,
  };
}

function catExpense(id: string, name: string) {
  return { id, user_id: 'u1', name, type: 'expense' as const, color: '#f00', icon: 'tag', created_at: '', updated_at: '' };
}
function catIncome(id: string, name: string) {
  return { id, user_id: 'u1', name, type: 'income' as const, color: '#0f0', icon: 'wallet', created_at: '', updated_at: '' };
}

// Multi-year, multi-category, multi-account dataset.
const MULTI_YEAR: Transaction[] = [
  txn({ id: '1', date: '2020-02-01', type: 'expense', amount: 100, account_id: 'acc-1', category_id: 'cat-food', categories: catExpense('cat-food', 'Food') }),
  txn({ id: '2', date: '2021-05-10', type: 'income', amount: 5000, account_id: 'acc-1', category_id: 'cat-salary', categories: catIncome('cat-salary', 'Salary') }),
  txn({ id: '3', date: '2022-08-20', type: 'expense', amount: 250, account_id: 'acc-2', category_id: 'cat-transport', categories: catExpense('cat-transport', 'Transport') }),
  txn({ id: '4', date: '2023-11-30', type: 'expense', amount: 400, account_id: 'acc-1', category_id: 'cat-food', categories: catExpense('cat-food', 'Food') }),
  txn({ id: '5', date: '2024-01-05', type: 'income', amount: 1200, account_id: 'acc-2', category_id: 'cat-freelance', categories: catIncome('cat-freelance', 'Freelance') }),
];

function filterByAccount(txns: Transaction[], accountId: string) {
  return txns.filter((t) => t.account_id === accountId);
}
function filterByCategories(txns: Transaction[], catIds: string[]) {
  const set = new Set(catIds);
  return txns.filter((t) => t.category_id !== null && set.has(t.category_id));
}

// ── Range removes date restriction ───────────────────────

describe('All Time — range covers the full data span', () => {
  it('includes every transaction (nothing dropped by the date filter)', () => {
    const range = getAllTimeRange(MULTI_YEAR);
    expect(range.startDate).toBe('2020-02-01');
    expect(range.endDate).toBe('2024-01-05');

    const included = filterTransactions(MULTI_YEAR, range);
    expect(included).toHaveLength(MULTI_YEAR.length);
  });

  it('is data-driven, not a fixed preset window', () => {
    const range = getAllTimeRange(MULTI_YEAR);
    // Unlike "thisYear"/"last30", the span reflects the actual first & last txn.
    expect(range.startDate).toBe('2020-02-01');
    expect(range.endDate).toBe('2024-01-05');
  });
});

// ── Full pipeline over all data ──────────────────────────

describe('All Time — full analytics pipeline', () => {
  const range = getAllTimeRange(MULTI_YEAR);
  const current = filterTransactions(MULTI_YEAR, range);

  it('summary aggregates every transaction', () => {
    const summary = computeSummary(current, [], MULTI_YEAR, range);
    expect(summary.totalIncome).toBe(6200);   // 5000 + 1200
    expect(summary.totalExpenses).toBe(750);   // 100 + 250 + 400
    expect(summary.savings).toBe(5450);
    expect(summary.transactionCount).toBe(5);
    expect(summary.currentBalance).toBe(5450); // allIncome - allExpenses
  });

  it('daily series is bounded to the data span and totals match', () => {
    const series = computeDailySeries(current, range);
    const totalExpenses = series.reduce((s, p) => s + p.expenses, 0);
    const totalIncome = series.reduce((s, p) => s + p.income, 0);
    expect(totalExpenses).toBe(750);
    expect(totalIncome).toBe(6200);
  });

  it('monthly series covers the full multi-year span', () => {
    const series = computeMonthlySeries(current, range);
    // Feb 2020 → Jan 2024 inclusive = 48 months
    expect(series.length).toBe(48);
    const totalExpenses = series.reduce((s, p) => s + p.expenses, 0);
    expect(totalExpenses).toBe(750);
  });

  it('category breakdown includes every expense category', () => {
    const breakdown = computeCategoryBreakdown(current, 'expense');
    const names = breakdown.map((b) => b.name).sort();
    expect(names).toEqual(['Food', 'Transport']);
    expect(breakdown.find((b) => b.name === 'Food')?.amount).toBe(500);
  });

  it('rankings surface the largest/smallest across the whole history', () => {
    const largest = getTransactionRankings(current, 'largest', 3);
    expect(largest[0]?.amount).toBe(5000);
    const smallest = getTransactionRankings(current, 'smallest', 1);
    expect(smallest[0]?.amount).toBe(100);
  });

  it('insights generate over the full span without error', () => {
    const summary = computeSummary(current, [], MULTI_YEAR, range);
    const breakdown = computeCategoryBreakdown(current, 'expense');
    const insights = generateInsights(current, summary, breakdown, 'USD');
    expect(Array.isArray(insights)).toBe(true);
    expect(insights.length).toBeGreaterThan(0);
  });

  it('yearly report reflects a chosen year within the span', () => {
    const report = computeYearlyReport(current, 2023);
    expect(report.totalExpenses).toBe(400); // only the 2023-11-30 Food expense
  });

  it('monthly report compares the full-span current set', () => {
    const report = computeMonthlyReport(current, [], 'All Time');
    expect(report.monthLabel).toBe('All Time');
    expect(report.totalIncome).toBe(6200);
    expect(report.totalExpenses).toBe(750);
    expect(report.transactionCount).toBe(5);
  });
});

// ── Combined with account & category filters ─────────────

describe('All Time — combined with account filter', () => {
  it('bounds the range and totals to a single account', () => {
    const acc1 = filterByAccount(MULTI_YEAR, 'acc-1');
    const range = getAllTimeRange(acc1);
    expect(range.startDate).toBe('2020-02-01'); // first acc-1 txn
    expect(range.endDate).toBe('2023-11-30');   // last acc-1 txn

    const summary = computeSummary(filterTransactions(acc1, range), [], acc1, range);
    expect(summary.totalExpenses).toBe(500);  // 100 + 400
    expect(summary.totalIncome).toBe(5000);
    expect(summary.transactionCount).toBe(3);
  });
});

describe('All Time — combined with (multiple) category filters', () => {
  it('single category bounds range + totals correctly', () => {
    const food = filterByCategories(MULTI_YEAR, ['cat-food']);
    const range = getAllTimeRange(food);
    expect(range.startDate).toBe('2020-02-01');
    expect(range.endDate).toBe('2023-11-30');

    const summary = computeSummary(filterTransactions(food, range), [], food, range);
    expect(summary.totalExpenses).toBe(500);
    expect(summary.transactionCount).toBe(2);
  });

  it('multiple categories aggregate across the full span', () => {
    const selected = filterByCategories(MULTI_YEAR, ['cat-food', 'cat-transport']);
    const range = getAllTimeRange(selected);
    const current = filterTransactions(selected, range);
    const summary = computeSummary(current, [], selected, range);
    expect(summary.totalExpenses).toBe(750); // 100 + 400 + 250
    expect(summary.transactionCount).toBe(3);

    const breakdown = computeCategoryBreakdown(current, 'expense');
    expect(breakdown.map((b) => b.name).sort()).toEqual(['Food', 'Transport']);
  });
});

// ── Edge cases ───────────────────────────────────────────

describe('All Time — edge cases', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2024-06-15T12:00:00')); });
  afterEach(() => { vi.useRealTimers(); });

  it('user with no transactions → empty, zeroed analytics', () => {
    const range = getAllTimeRange([]);
    expect(range).toEqual({ startDate: '2024-06-15', endDate: '2024-06-15' });

    const current = filterTransactions([], range);
    const summary = computeSummary(current, [], [], range);
    expect(summary.transactionCount).toBe(0);
    expect(summary.totalExpenses).toBe(0);
    expect(computeCategoryBreakdown(current, 'expense')).toHaveLength(0);
    expect(getTransactionRankings(current, 'largest')).toHaveLength(0);
  });

  it('user with exactly one transaction → single-day span', () => {
    const one = [txn({ id: '1', date: '2023-04-01', type: 'expense', amount: 99 })];
    const range = getAllTimeRange(one);
    expect(range).toEqual({ startDate: '2023-04-01', endDate: '2023-04-01' });

    const current = filterTransactions(one, range);
    const summary = computeSummary(current, [], one, range);
    expect(summary.totalExpenses).toBe(99);
    expect(summary.transactionCount).toBe(1);
    expect(computeDailySeries(current, range)).toHaveLength(1);
  });

  it('user with thousands of transactions → complete + fast', () => {
    const many: Transaction[] = Array.from({ length: 5000 }, (_, i) =>
      txn({
        id: `t-${i}`,
        date: `20${10 + (i % 14)}-${String((i % 12) + 1).padStart(2, '0')}-15`,
        type: i % 2 === 0 ? 'expense' : 'income',
        amount: 10 + (i % 100),
        category_id: `cat-${i % 6}`,
        categories: catExpense(`cat-${i % 6}`, `Cat ${i % 6}`),
      }),
    );

    const start = performance.now();
    const range = getAllTimeRange(many);
    const current = filterTransactions(many, range);
    const summary = computeSummary(current, [], many, range);
    computeCategoryBreakdown(current, 'expense');
    getTransactionRankings(current, 'largest', 10);
    const elapsed = performance.now() - start;

    // No transaction is dropped by the "all time" range.
    expect(current).toHaveLength(5000);
    expect(summary.transactionCount).toBe(5000);
    expect(elapsed).toBeLessThan(200);
  });

  it('getDateRange("allTime") delegates to getAllTimeRange', () => {
    expect(getDateRange('allTime', undefined, MULTI_YEAR)).toEqual(getAllTimeRange(MULTI_YEAR));
  });
});

