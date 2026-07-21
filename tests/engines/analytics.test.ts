import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDateRange,
  getPreviousPeriod,
  filterTransactions,
  computeSummary,
  computeDailySeries,
  computeWeeklySeries,
  computeMonthlySeries,
  computeSavingsTrend,
  computeCategoryBreakdown,
  computeHeatmap,
  computeFinancialHealth,
  generateInsights,
  computeSpendingPatterns,
  computeMonthlyReport,
  computeYearlyReport,
  getTransactionRankings,
  generateCSV,
  downloadFile,
} from '@/engines/analytics';
import type { Transaction } from '@/types';
import type { AnalyticsSummary, DateRange } from '@/types/analytics';

// --------------- helpers ---------------

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'txn-1',
    user_id: 'u1',
    category_id: 'cat-1',
    type: 'expense',
    amount: 100,
    description: 'Test',
    notes: null,
    date: '2024-06-15',
    created_at: '2024-06-15T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
    categories: { id: 'cat-1', user_id: 'u1', name: 'Food', type: 'expense', color: '#ef4444', icon: 'utensils', created_at: '', updated_at: '' },
    ...overrides,
  };
}

function makeSummary(overrides: Partial<AnalyticsSummary> = {}): AnalyticsSummary {
  return {
    currentBalance: 500,
    totalIncome: 1000,
    totalExpenses: 500,
    savings: 500,
    savingsRate: 50,
    transactionCount: 10,
    avgDailySpending: 50,
    avgMonthlySpending: 500,
    highestExpense: 200,
    highestIncome: 500,
    incomeChange: 10,
    expenseChange: -5,
    savingsChange: 15,
    transactionCountChange: 5,
    ...overrides,
  };
}

// --------------- getDateRange ---------------

describe('getDateRange', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2024-06-15T12:00:00')); });
  afterEach(() => { vi.useRealTimers(); });

  it('today', () => {
    const r = getDateRange('today');
    expect(r.startDate).toBe('2024-06-15');
    expect(r.endDate).toBe('2024-06-15');
  });

  it('yesterday', () => {
    const r = getDateRange('yesterday');
    expect(r.startDate).toBe('2024-06-14');
    expect(r.endDate).toBe('2024-06-14');
  });

  it('last7', () => {
    const r = getDateRange('last7');
    expect(r.startDate).toBe('2024-06-09');
    expect(r.endDate).toBe('2024-06-15');
  });

  it('last30', () => {
    const r = getDateRange('last30');
    expect(r.startDate).toBe('2024-05-17');
    expect(r.endDate).toBe('2024-06-15');
  });

  it('thisMonth', () => {
    const r = getDateRange('thisMonth');
    expect(r.startDate).toBe('2024-06-01');
    expect(r.endDate).toBe('2024-06-30');
  });

  it('lastMonth', () => {
    const r = getDateRange('lastMonth');
    expect(r.startDate).toBe('2024-05-01');
    expect(r.endDate).toBe('2024-05-31');
  });

  it('last3Months', () => {
    const r = getDateRange('last3Months');
    expect(r.startDate).toBe('2024-04-01');
    expect(r.endDate).toBe('2024-06-15');
  });

  it('last6Months', () => {
    const r = getDateRange('last6Months');
    expect(r.startDate).toBe('2024-01-01');
    expect(r.endDate).toBe('2024-06-15');
  });

  it('thisYear', () => {
    const r = getDateRange('thisYear');
    expect(r.startDate).toBe('2024-01-01');
    expect(r.endDate).toBe('2024-12-31');
  });

  it('custom with range', () => {
    const r = getDateRange('custom', { startDate: '2024-03-01', endDate: '2024-03-31' });
    expect(r.startDate).toBe('2024-03-01');
    expect(r.endDate).toBe('2024-03-31');
  });

  it('custom without range defaults to today', () => {
    const r = getDateRange('custom');
    expect(r.startDate).toBe('2024-06-15');
    expect(r.endDate).toBe('2024-06-15');
  });
});

// --------------- getPreviousPeriod ---------------

describe('getPreviousPeriod', () => {
  it('computes previous period of same length', () => {
    const range: DateRange = { startDate: '2024-06-01', endDate: '2024-06-30' };
    const prev = getPreviousPeriod(range);
    expect(prev.endDate).toBe('2024-05-31');
    expect(prev.startDate).toBe('2024-05-02');
  });

  it('handles single-day range', () => {
    const range: DateRange = { startDate: '2024-06-15', endDate: '2024-06-15' };
    const prev = getPreviousPeriod(range);
    expect(prev.startDate).toBe('2024-06-14');
    expect(prev.endDate).toBe('2024-06-14');
  });
});

// --------------- filterTransactions ---------------

describe('filterTransactions', () => {
  const txns = [
    txn({ id: '1', date: '2024-06-01', type: 'expense', category_id: 'cat-1' }),
    txn({ id: '2', date: '2024-06-15', type: 'income', category_id: 'cat-2' }),
    txn({ id: '3', date: '2024-07-01', type: 'expense', category_id: 'cat-1' }),
  ];
  const range: DateRange = { startDate: '2024-06-01', endDate: '2024-06-30' };

  it('filters by date range', () => {
    const result = filterTransactions(txns, range);
    expect(result).toHaveLength(2);
  });

  it('filters by type', () => {
    const result = filterTransactions(txns, range, { type: 'expense' });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('1');
  });

  it('filters by categoryId', () => {
    const result = filterTransactions(txns, range, { categoryId: 'cat-2' });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('2');
  });

  it('type=all returns all in range', () => {
    const result = filterTransactions(txns, range, { type: 'all' });
    expect(result).toHaveLength(2);
  });

  // ── Multi-category (categoryIds) tests ──

  it('filters by multiple categoryIds', () => {
    const allInRange = [
      txn({ id: '1', date: '2024-06-01', type: 'expense', category_id: 'cat-1' }),
      txn({ id: '2', date: '2024-06-15', type: 'income', category_id: 'cat-2' }),
      txn({ id: '4', date: '2024-06-10', type: 'expense', category_id: 'cat-3' }),
    ];
    const result = filterTransactions(allInRange, range, { categoryIds: ['cat-1', 'cat-3'] });
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id).sort()).toEqual(['1', '4']);
  });

  it('categoryIds with single category', () => {
    const result = filterTransactions(txns, range, { categoryIds: ['cat-2'] });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('2');
  });

  it('categoryIds empty array returns nothing', () => {
    const result = filterTransactions(txns, range, { categoryIds: [] });
    expect(result).toHaveLength(0);
  });

  it('categoryIds excludes null category_id transactions', () => {
    const withNull = [
      txn({ id: '1', date: '2024-06-01', category_id: 'cat-1' }),
      txn({ id: '2', date: '2024-06-10', category_id: null, categories: undefined }),
    ];
    const result = filterTransactions(withNull, range, { categoryIds: ['cat-1'] });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('1');
  });

  it('categoryIds + type filter work together', () => {
    const mixed = [
      txn({ id: '1', date: '2024-06-01', type: 'expense', category_id: 'cat-1' }),
      txn({ id: '2', date: '2024-06-10', type: 'income', category_id: 'cat-1' }),
      txn({ id: '3', date: '2024-06-15', type: 'expense', category_id: 'cat-2' }),
    ];
    const result = filterTransactions(mixed, range, { categoryIds: ['cat-1'], type: 'expense' });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('1');
  });

  it('categoryIds + date range work together', () => {
    const result = filterTransactions(txns, range, { categoryIds: ['cat-1'] });
    // Only id=1 is in range AND has cat-1 (id=3 is out of range)
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('1');
  });

  it('undefined categoryIds does not filter (backward compat)', () => {
    const result = filterTransactions(txns, range, { categoryIds: undefined });
    expect(result).toHaveLength(2); // all in range
  });
});

// --------------- computeSummary ---------------

describe('computeSummary', () => {
  it('computes correct summary stats', () => {
    const current = [
      txn({ type: 'income', amount: 1000 }),
      txn({ type: 'expense', amount: 300 }),
      txn({ type: 'expense', amount: 200 }),
    ];
    const previous = [
      txn({ type: 'income', amount: 800 }),
      txn({ type: 'expense', amount: 400 }),
    ];
    const range: DateRange = { startDate: '2024-06-01', endDate: '2024-06-30' };

    const summary = computeSummary(current, previous, current, range);

    expect(summary.totalIncome).toBe(1000);
    expect(summary.totalExpenses).toBe(500);
    expect(summary.savings).toBe(500);
    expect(summary.savingsRate).toBe(50);
    expect(summary.transactionCount).toBe(3);
    expect(summary.highestExpense).toBe(300);
    expect(summary.highestIncome).toBe(1000);
    expect(summary.incomeChange).toBe(25); // (1000-800)/800 = 25%
    expect(summary.expenseChange).toBe(25); // (500-400)/400 = 25%
  });

  it('handles zero income', () => {
    const current = [txn({ type: 'expense', amount: 100 })];
    const range: DateRange = { startDate: '2024-06-15', endDate: '2024-06-15' };
    const summary = computeSummary(current, [], current, range);
    expect(summary.savingsRate).toBe(0);
  });

  it('handles no transactions', () => {
    const range: DateRange = { startDate: '2024-06-01', endDate: '2024-06-30' };
    const summary = computeSummary([], [], [], range);
    expect(summary.totalIncome).toBe(0);
    expect(summary.totalExpenses).toBe(0);
    expect(summary.highestExpense).toBe(0);
    expect(summary.highestIncome).toBe(0);
    expect(summary.transactionCount).toBe(0);
  });

  it('handles previous period with zero then current > 0', () => {
    const current = [txn({ type: 'income', amount: 500 })];
    const range: DateRange = { startDate: '2024-06-01', endDate: '2024-06-30' };
    const summary = computeSummary(current, [], current, range);
    expect(summary.incomeChange).toBe(100); // from 0 to positive = 100%
  });

  it('handles previous period with zero then current negative savings', () => {
    // Only expenses, no income → negative savings
    const current = [txn({ type: 'expense', amount: 500 })];
    const range: DateRange = { startDate: '2024-06-01', endDate: '2024-06-30' };
    const summary = computeSummary(current, [], current, range);
    // savings = 0 - 500 = -500, prevSavings = 0
    // pctChange(-500, 0) should return -100
    expect(summary.savingsChange).toBe(-100);
  });
});

// --------------- computeDailySeries ---------------

describe('computeDailySeries', () => {
  it('builds correct daily series', () => {
    const txns = [
      txn({ date: '2024-06-01', type: 'expense', amount: 50 }),
      txn({ date: '2024-06-01', type: 'income', amount: 200 }),
      txn({ date: '2024-06-02', type: 'expense', amount: 30 }),
    ];
    const range: DateRange = { startDate: '2024-06-01', endDate: '2024-06-03' };
    const series = computeDailySeries(txns, range);

    expect(series).toHaveLength(3);
    expect(series[0]?.income).toBe(200);
    expect(series[0]?.expenses).toBe(50);
    expect(series[0]?.net).toBe(150);
    expect(series[1]?.expenses).toBe(30);
    expect(series[2]?.income).toBe(0);
    expect(series[2]?.expenses).toBe(0);
  });
});

// --------------- computeWeeklySeries ---------------

describe('computeWeeklySeries', () => {
  it('groups transactions by week', () => {
    const txns = [
      txn({ date: '2024-06-01', type: 'expense', amount: 50 }),
      txn({ date: '2024-06-05', type: 'expense', amount: 30 }),
      txn({ date: '2024-06-10', type: 'income', amount: 200 }),
    ];
    const range: DateRange = { startDate: '2024-06-01', endDate: '2024-06-14' };
    const series = computeWeeklySeries(txns, range);

    expect(series.length).toBeGreaterThanOrEqual(2);
    // First week should have expenses
    expect(series[0]?.expenses).toBeGreaterThan(0);
  });

  it('handles short range (<= 14 days) label formatting', () => {
    const range: DateRange = { startDate: '2024-06-01', endDate: '2024-06-07' };
    const series = computeWeeklySeries([], range);
    expect(series.length).toBeGreaterThanOrEqual(1);
    // Short ranges use simpler label
    expect(series[0]?.label).toBeDefined();
  });
});

// --------------- computeMonthlySeries ---------------

describe('computeMonthlySeries', () => {
  it('groups transactions by month', () => {
    const txns = [
      txn({ date: '2024-01-15', type: 'expense', amount: 100 }),
      txn({ date: '2024-01-20', type: 'income', amount: 500 }),
      txn({ date: '2024-02-10', type: 'expense', amount: 200 }),
    ];
    const range: DateRange = { startDate: '2024-01-01', endDate: '2024-03-31' };
    const series = computeMonthlySeries(txns, range);

    expect(series).toHaveLength(3);
    expect(series[0]?.expenses).toBe(100);
    expect(series[0]?.income).toBe(500);
    expect(series[1]?.expenses).toBe(200);
    expect(series[2]?.expenses).toBe(0);
  });
});

// --------------- computeSavingsTrend ---------------

describe('computeSavingsTrend', () => {
  it('computes cumulative savings', () => {
    const txns = [
      txn({ date: '2024-01-15', type: 'income', amount: 1000 }),
      txn({ date: '2024-01-20', type: 'expense', amount: 300 }),
      txn({ date: '2024-02-10', type: 'income', amount: 500 }),
      txn({ date: '2024-02-15', type: 'expense', amount: 200 }),
    ];
    const range: DateRange = { startDate: '2024-01-01', endDate: '2024-02-28' };
    const series = computeSavingsTrend(txns, range);

    expect(series).toHaveLength(2);
    // Jan: 1000 - 300 = 700
    expect(series[0]?.net).toBe(700);
    // Feb cumulative: 700 + (500 - 200) = 1000
    expect(series[1]?.net).toBe(1000);
  });
});

// --------------- computeCategoryBreakdown ---------------

describe('computeCategoryBreakdown', () => {
  it('groups expenses by category', () => {
    const txns = [
      txn({ type: 'expense', amount: 100, categories: { id: 'c1', user_id: 'u1', name: 'Food', type: 'expense', color: '#f00', icon: 'utensils', created_at: '', updated_at: '' } }),
      txn({ type: 'expense', amount: 50, categories: { id: 'c1', user_id: 'u1', name: 'Food', type: 'expense', color: '#f00', icon: 'utensils', created_at: '', updated_at: '' } }),
      txn({ type: 'expense', amount: 200, categories: { id: 'c2', user_id: 'u1', name: 'Transport', type: 'expense', color: '#00f', icon: 'car', created_at: '', updated_at: '' } }),
      txn({ type: 'income', amount: 1000 }), // should be excluded
    ];

    const breakdown = computeCategoryBreakdown(txns, 'expense');

    expect(breakdown).toHaveLength(2);
    // Sorted by amount desc: Transport (200), Food (150)
    expect(breakdown[0]?.name).toBe('Transport');
    expect(breakdown[0]?.amount).toBe(200);
    expect(breakdown[0]?.count).toBe(1);
    expect(breakdown[1]?.name).toBe('Food');
    expect(breakdown[1]?.amount).toBe(150);
    expect(breakdown[1]?.count).toBe(2);
    expect(breakdown[1]?.avgTransaction).toBe(75);
    expect(breakdown[1]?.highestTransaction).toBe(100);
    expect(breakdown[1]?.lowestTransaction).toBe(50);
  });

  it('handles missing category', () => {
    const txns = [txn({ type: 'expense', amount: 100, categories: undefined })];
    const breakdown = computeCategoryBreakdown(txns, 'expense');
    expect(breakdown[0]?.name).toBe('Uncategorized');
  });

  it('returns empty for no matching transactions', () => {
    const txns = [txn({ type: 'income', amount: 100 })];
    const breakdown = computeCategoryBreakdown(txns, 'expense');
    expect(breakdown).toHaveLength(0);
  });
});

// --------------- computeHeatmap ---------------

describe('computeHeatmap', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2024-06-15T12:00:00')); });
  afterEach(() => { vi.useRealTimers(); });

  it('returns 365 days', () => {
    const heatmap = computeHeatmap([]);
    expect(heatmap).toHaveLength(365);
    expect(heatmap.every((d) => d.level === 0)).toBe(true);
  });

  it('assigns levels based on spending', () => {
    const txns = [
      txn({ date: '2024-06-15', type: 'expense', amount: 100 }),
      txn({ date: '2024-06-14', type: 'expense', amount: 25 }), // 25% of max
      txn({ date: '2024-06-13', type: 'expense', amount: 50 }), // 50%
      txn({ date: '2024-06-12', type: 'expense', amount: 75 }), // 75%
    ];
    const heatmap = computeHeatmap(txns);

    const day15 = heatmap.find((d) => d.date === '2024-06-15');
    expect(day15?.level).toBe(4); // 100% of max

    const day14 = heatmap.find((d) => d.date === '2024-06-14');
    expect(day14?.level).toBe(1); // 25%

    const day13 = heatmap.find((d) => d.date === '2024-06-13');
    expect(day13?.level).toBe(2); // 50%

    const day12 = heatmap.find((d) => d.date === '2024-06-12');
    expect(day12?.level).toBe(3); // 75%
  });

  it('ignores income transactions', () => {
    const txns = [txn({ date: '2024-06-15', type: 'income', amount: 1000 })];
    const heatmap = computeHeatmap(txns);
    const day15 = heatmap.find((d) => d.date === '2024-06-15');
    expect(day15?.amount).toBe(0);
  });
});

// --------------- computeFinancialHealth ---------------

describe('computeFinancialHealth', () => {
  it('excellent health (score >= 85)', () => {
    const summary = makeSummary({ savingsRate: 50, totalIncome: 5000, totalExpenses: 2000, expenseChange: 5 });
    const health = computeFinancialHealth(summary);
    expect(health.grade).toBe('A');
    expect(health.label).toBe('Excellent');
    expect(health.color).toBe('#10b981');
    expect(health.factors).toHaveLength(4);
  });

  it('good health (70-84)', () => {
    // savingsRate:22 → 13, income>0→25, ratio 2500/5000=0.5→25, change:18→abs>15→10
    // total = 13+25+25+10 = 73 → B ✓
    const summary = makeSummary({ savingsRate: 22, totalIncome: 5000, totalExpenses: 2500, expenseChange: 18 });
    const health = computeFinancialHealth(summary);
    expect(health.score).toBeGreaterThanOrEqual(70);
    expect(health.score).toBeLessThan(85);
    expect(health.grade).toBe('B');
    expect(health.label).toBe('Good');
  });

  it('fair health (55-69)', () => {
    // savingsRate:10 → 6, income:2000→25, ratio 1200/2000=0.6→(1-0.6)*50=20, change:25→abs(25)<=30→10
    // total = 6+25+20+10 = 61 → C
    const summary = makeSummary({ savingsRate: 10, totalIncome: 2000, totalExpenses: 1200, expenseChange: 25 });
    const health = computeFinancialHealth(summary);
    expect(health.score).toBeGreaterThanOrEqual(55);
    expect(health.score).toBeLessThan(70);
    expect(health.grade).toBe('C');
    expect(health.label).toBe('Fair');
  });

  it('needs work (40-54)', () => {
    // savingsRate:5→3, income:1000→25, ratio 900/1000=0.9→(1-0.9)*50=5, change:35→abs(35)>30→5
    // total = 3+25+5+5 = 38 → F. Need to adjust.
    // savingsRate:8→5, income>0→25, ratio 600/1000=0.6→(1-0.6)*50=20, change:35→5
    // total = 5+25+20+5 = 55 → C. hmm. Let me compute for D.
    // Need 40-54. savingsRate:5→3, income:500→25, ratio 400/500=0.8→(1-0.8)*50=10, change:20→abs=20→10
    // total = 3+25+10+10 = 48 → D
    const summary = makeSummary({ savingsRate: 5, totalIncome: 500, totalExpenses: 400, expenseChange: 20 });
    const health = computeFinancialHealth(summary);
    expect(health.score).toBeGreaterThanOrEqual(40);
    expect(health.score).toBeLessThan(55);
    expect(health.grade).toBe('D');
    expect(health.label).toBe('Needs Work');
  });

  it('poor health (< 40)', () => {
    const summary = makeSummary({ savingsRate: 0, totalIncome: 0, totalExpenses: 500, expenseChange: 50 });
    const health = computeFinancialHealth(summary);
    expect(health.grade).toBe('F');
    expect(health.label).toBe('Poor');
    expect(health.color).toBe('#ef4444');
  });

  it('factor descriptions cover all branches', () => {
    // savings >= 20
    const h1 = computeFinancialHealth(makeSummary({ savingsRate: 25 }));
    expect(h1.factors[0]?.description).toBe('Excellent savings rate');
    // savings 10-19
    const h2 = computeFinancialHealth(makeSummary({ savingsRate: 15 }));
    expect(h2.factors[0]?.description).toBe('Good savings rate');
    // savings < 10
    const h3 = computeFinancialHealth(makeSummary({ savingsRate: 5 }));
    expect(h3.factors[0]?.description).toBe('Consider increasing savings');

    // expense control
    const h4 = computeFinancialHealth(makeSummary({ totalIncome: 1000, totalExpenses: 400 }));
    expect(h4.factors[2]?.description).toBe('Expenses well controlled');
    const h5 = computeFinancialHealth(makeSummary({ totalIncome: 1000, totalExpenses: 700 }));
    expect(h5.factors[2]?.description).toBe('Reasonable spending');
    const h6 = computeFinancialHealth(makeSummary({ totalIncome: 1000, totalExpenses: 900 }));
    expect(h6.factors[2]?.description).toBe('Expenses may be too high');

    // consistency
    const h7 = computeFinancialHealth(makeSummary({ expenseChange: 10 }));
    expect(h7.factors[3]?.description).toBe('Stable spending patterns');
    const h8 = computeFinancialHealth(makeSummary({ expenseChange: 40 }));
    expect(h8.factors[3]?.description).toBe('Spending patterns vary significantly');
  });
});

// --------------- generateInsights ---------------

describe('generateInsights', () => {
  it('generates top category insight', () => {
    const cats = [{ name: 'Food', percentage: 30, amount: 300, color: '#f00', icon: 'utensils', count: 5, avgTransaction: 60, highestTransaction: 100, lowestTransaction: 20 }];
    const summary = makeSummary();
    const insights = generateInsights([], summary, cats, 'USD');
    expect(insights.some((i) => i.message.includes('Food'))).toBe(true);
  });

  it('generates great savings insight', () => {
    const summary = makeSummary({ savingsRate: 25 });
    const insights = generateInsights([], summary, [], 'USD');
    expect(insights.some((i) => i.type === 'success' && i.message.includes('25%'))).toBe(true);
  });

  it('generates low savings warning', () => {
    const summary = makeSummary({ savingsRate: 5 });
    const insights = generateInsights([], summary, [], 'USD');
    expect(insights.some((i) => i.type === 'warning' && i.message.includes('5%'))).toBe(true);
  });

  it('generates spending increase warning', () => {
    const summary = makeSummary({ expenseChange: 30 });
    const insights = generateInsights([], summary, [], 'USD');
    expect(insights.some((i) => i.type === 'warning' && i.message.includes('30%'))).toBe(true);
  });

  it('generates spending decrease success', () => {
    const summary = makeSummary({ expenseChange: -15 });
    const insights = generateInsights([], summary, [], 'USD');
    expect(insights.some((i) => i.type === 'success' && i.message.includes('15%'))).toBe(true);
  });

  it('generates savings improvement insight', () => {
    const summary = makeSummary({ savingsChange: 20, savings: 500 });
    const insights = generateInsights([], summary, [], 'USD');
    expect(insights.some((i) => i.message.includes('20% more'))).toBe(true);
  });

  it('generates weekend spending insight', () => {
    // Saturday = June 15 2024
    const txns = [
      txn({ date: '2024-06-15', type: 'expense', amount: 200 }), // Saturday
      txn({ date: '2024-06-10', type: 'expense', amount: 50 }),  // Monday
    ];
    const summary = makeSummary();
    const insights = generateInsights(txns, summary, [], 'USD');
    expect(insights.some((i) => i.message.includes('Weekend'))).toBe(true);
  });

  it('generates busiest day insight', () => {
    const txns = [
      txn({ date: '2024-06-14', type: 'expense', amount: 500 }), // Friday
    ];
    const summary = makeSummary();
    const insights = generateInsights(txns, summary, [], 'USD');
    expect(insights.some((i) => i.message.includes('Fridays'))).toBe(true);
  });

  it('generates high-percentage category tip', () => {
    const cats = [{ name: 'Rent', percentage: 40, amount: 2000, color: '#f00', icon: 'home', count: 1, avgTransaction: 2000, highestTransaction: 2000, lowestTransaction: 2000 }];
    const summary = makeSummary();
    const insights = generateInsights([], summary, cats, 'USD');
    expect(insights.some((i) => i.type === 'tip' && i.message.includes('Rent'))).toBe(true);
  });

  it('generates highest expense insight', () => {
    const summary = makeSummary({ highestExpense: 999.99 });
    const insights = generateInsights([], summary, [], 'USD');
    expect(insights.some((i) => i.message.includes('$999.99'))).toBe(true);
  });

  it('generates avg daily spending insight', () => {
    const summary = makeSummary({ avgDailySpending: 42.50 });
    const insights = generateInsights([], summary, [], 'USD');
    expect(insights.some((i) => i.message.includes('$42.50'))).toBe(true);
  });

  // Multi-currency verification
  describe('multi-currency insights', () => {
    it('formats highest expense with INR symbol', () => {
      const summary = makeSummary({ highestExpense: 999.99 });
      const insights = generateInsights([], summary, [], 'INR');
      expect(insights.some((i) => i.message.includes('₹'))).toBe(true);
      expect(insights.some((i) => i.message.includes('999.99'))).toBe(true);
    });

    it('formats avg daily spending with EUR symbol', () => {
      const summary = makeSummary({ avgDailySpending: 42.50 });
      const insights = generateInsights([], summary, [], 'EUR');
      expect(insights.some((i) => i.message.includes('€'))).toBe(true);
      expect(insights.some((i) => i.message.includes('42.50'))).toBe(true);
    });

    it('formats highest expense with GBP symbol', () => {
      const summary = makeSummary({ highestExpense: 1500 });
      const insights = generateInsights([], summary, [], 'GBP');
      expect(insights.some((i) => i.message.includes('£'))).toBe(true);
      expect(insights.some((i) => i.message.includes('1,500'))).toBe(true);
    });

    it('formats JPY without decimal places', () => {
      const summary = makeSummary({ highestExpense: 10000 });
      const insights = generateInsights([], summary, [], 'JPY');
      const msg = insights.find((i) => i.message.includes('largest expense'));
      expect(msg).toBeDefined();
      expect(msg!.message).toContain('¥');
      expect(msg!.message).not.toContain('.');
    });

    it('uses different symbols for different currencies', () => {
      const summary = makeSummary({ highestExpense: 500, avgDailySpending: 100 });
      const usd = generateInsights([], summary, [], 'USD');
      const inr = generateInsights([], summary, [], 'INR');
      const usdMsg = usd.find((i) => i.message.includes('largest expense'))!.message;
      const inrMsg = inr.find((i) => i.message.includes('largest expense'))!.message;
      expect(usdMsg).toContain('$');
      expect(inrMsg).toContain('₹');
      expect(usdMsg).not.toEqual(inrMsg);
    });
  });
});

// --------------- computeSpendingPatterns ---------------

describe('computeSpendingPatterns', () => {
  it('separates weekday and weekend spending', () => {
    const txns = [
      txn({ date: '2024-06-10', type: 'expense', amount: 100 }), // Mon
      txn({ date: '2024-06-11', type: 'expense', amount: 100 }), // Tue
      txn({ date: '2024-06-15', type: 'expense', amount: 200 }), // Sat
      txn({ date: '2024-06-16', type: 'expense', amount: 300 }), // Sun
    ];

    const patterns = computeSpendingPatterns(txns);

    expect(patterns.weekdayTotal).toBe(200);
    expect(patterns.weekendTotal).toBe(500);
    expect(patterns.weekdayAvg).toBe(100);
    expect(patterns.weekendAvg).toBe(250);
    expect(patterns.byDayOfWeek).toHaveLength(7);
    expect(patterns.busiestDay).toBeDefined();
    expect(patterns.quietestDay).toBeDefined();
  });

  it('handles no expense transactions', () => {
    const txns = [txn({ type: 'income', amount: 1000 })];
    const patterns = computeSpendingPatterns(txns);
    expect(patterns.weekdayTotal).toBe(0);
    expect(patterns.weekendTotal).toBe(0);
    expect(patterns.weekdayAvg).toBe(0);
    expect(patterns.weekendAvg).toBe(0);
  });
});

// --------------- computeMonthlyReport ---------------

describe('computeMonthlyReport', () => {
  it('computes monthly report with comparison', () => {
    const current = [
      txn({ type: 'income', amount: 3000 }),
      txn({ type: 'expense', amount: 1000, categories: { id: 'c1', user_id: 'u1', name: 'Rent', type: 'expense', color: '#f00', icon: 'home', created_at: '', updated_at: '' } }),
      txn({ type: 'expense', amount: 500, date: '2024-06-10', categories: { id: 'c2', user_id: 'u1', name: 'Food', type: 'expense', color: '#0f0', icon: 'utensils', created_at: '', updated_at: '' } }),
    ];
    const previous = [
      txn({ type: 'income', amount: 2500 }),
      txn({ type: 'expense', amount: 800 }),
    ];

    const report = computeMonthlyReport(current, previous, 'June 2024');

    expect(report.monthLabel).toBe('June 2024');
    expect(report.totalIncome).toBe(3000);
    expect(report.totalExpenses).toBe(1500);
    expect(report.savings).toBe(1500);
    expect(report.biggestCategory).toBe('Rent');
    expect(report.transactionCount).toBe(3);
    expect(report.comparisonText).toContain('more');
  });

  it('reports spending decrease', () => {
    const current = [txn({ type: 'expense', amount: 100 })];
    const previous = [txn({ type: 'expense', amount: 500 })];
    const report = computeMonthlyReport(current, previous, 'June 2024');
    expect(report.comparisonText).toContain('less');
  });

  it('reports consistent spending when unchanged', () => {
    const current = [txn({ type: 'expense', amount: 500 })];
    const previous = [txn({ type: 'expense', amount: 500 })];
    const report = computeMonthlyReport(current, previous, 'June 2024');
    expect(report.comparisonText).toContain('consistent');
  });

  it('handles no transactions', () => {
    const report = computeMonthlyReport([], [], 'June 2024');
    expect(report.avgTransaction).toBe(0);
    expect(report.biggestCategory).toBe('N/A');
    expect(report.mostExpensiveDay).toBe('N/A');
  });

  it('adds savings improvement text', () => {
    const current = [
      txn({ type: 'income', amount: 1000 }),
      txn({ type: 'expense', amount: 200 }),
    ];
    const previous = [
      txn({ type: 'income', amount: 1000 }),
      txn({ type: 'expense', amount: 800 }),
    ];
    const report = computeMonthlyReport(current, previous, 'June 2024');
    expect(report.comparisonText).toContain('saved');
  });
});

// --------------- computeYearlyReport ---------------

describe('computeYearlyReport', () => {
  it('computes yearly report with monthly breakdown', () => {
    const txns = [
      txn({ date: '2024-01-15', type: 'income', amount: 5000 }),
      txn({ date: '2024-01-20', type: 'expense', amount: 2000 }),
      txn({ date: '2024-03-10', type: 'expense', amount: 3000 }),
      txn({ date: '2024-06-01', type: 'income', amount: 4000 }),
    ];

    const report = computeYearlyReport(txns, 2024);

    expect(report.year).toBe(2024);
    expect(report.months).toHaveLength(12);
    expect(report.totalIncome).toBe(9000);
    expect(report.totalExpenses).toBe(5000);
    expect(report.totalSavings).toBe(4000);
    expect(report.highestSpendingMonth).toBe('March');
    expect(report.highestIncomeMonth).toBe('January');
    expect(report.bestSavingsMonth).toBeDefined();
  });

  it('handles year with no transactions', () => {
    const report = computeYearlyReport([], 2024);
    expect(report.totalIncome).toBe(0);
    expect(report.totalExpenses).toBe(0);
    expect(report.avgMonthlySpending).toBe(0);
    expect(report.avgMonthlyIncome).toBe(0);
  });
});

// --------------- getTransactionRankings ---------------

describe('getTransactionRankings', () => {
  it('returns largest transactions sorted desc', () => {
    const txns = [
      txn({ id: '1', amount: 50, description: 'Small' }),
      txn({ id: '2', amount: 500, description: 'Large' }),
      txn({ id: '3', amount: 200, description: 'Medium' }),
    ];

    const rankings = getTransactionRankings(txns, 'largest', 2);
    expect(rankings).toHaveLength(2);
    expect(rankings[0]?.description).toBe('Large');
    expect(rankings[1]?.description).toBe('Medium');
  });

  it('returns smallest transactions sorted asc', () => {
    const txns = [
      txn({ id: '1', amount: 50 }),
      txn({ id: '2', amount: 500 }),
      txn({ id: '3', amount: 200 }),
    ];

    const rankings = getTransactionRankings(txns, 'smallest', 2);
    expect(rankings).toHaveLength(2);
    expect(rankings[0]?.amount).toBe(50);
    expect(rankings[1]?.amount).toBe(200);
  });

  it('handles missing category info', () => {
    const txns = [txn({ categories: undefined })];
    const rankings = getTransactionRankings(txns, 'largest');
    expect(rankings[0]?.categoryName).toBe('Uncategorized');
    expect(rankings[0]?.categoryColor).toBe('#6b7280');
  });
});

// --------------- generateCSV ---------------

describe('generateCSV', () => {
  it('generates valid CSV string', () => {
    const txns = [
      txn({ date: '2024-06-15', type: 'expense', amount: 42.50, description: 'Coffee', notes: 'Starbucks' }),
    ];
    const csv = generateCSV(txns);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Date,Type,Category,Description,Amount,Notes');
    expect(lines[1]).toContain('2024-06-15');
    expect(lines[1]).toContain('expense');
    expect(lines[1]).toContain('"Coffee"');
    expect(lines[1]).toContain('42.5');
    expect(lines[1]).toContain('"Starbucks"');
  });

  it('escapes quotes in description', () => {
    const txns = [txn({ description: 'He said "hello"', notes: null })];
    const csv = generateCSV(txns);
    expect(csv).toContain('"He said ""hello"""');
  });

  it('handles null notes', () => {
    const txns = [txn({ notes: null })];
    const csv = generateCSV(txns);
    expect(csv).toContain('""');
  });

  it('handles null category', () => {
    const txns = [txn({ categories: undefined })];
    const csv = generateCSV(txns);
    const lines = csv.split('\n');
    // Category should be empty string
    expect(lines[1]).toBeDefined();
  });
});

// --------------- downloadFile ---------------

describe('downloadFile', () => {
  it('creates and clicks a download link', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURL = vi.fn();
    const mockLink = { href: '', download: '', click: vi.fn() };
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
    const appendChild = vi.spyOn(document.body, 'appendChild').mockReturnValue(mockLink as unknown as Node);
    const removeChild = vi.spyOn(document.body, 'removeChild').mockReturnValue(mockLink as unknown as Node);

    Object.assign(globalThis.URL, { createObjectURL, revokeObjectURL });

    downloadFile('test content', 'export.csv', 'text/csv');

    expect(createElement).toHaveBeenCalledWith('a');
    expect(mockLink.download).toBe('export.csv');
    expect(mockLink.click).toHaveBeenCalled();
    expect(appendChild).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();

    createElement.mockRestore();
    appendChild.mockRestore();
    removeChild.mockRestore();
  });
});

