/**
 * Category Filter — Analytics Engine Integration Tests
 *
 * End-to-end tests verifying that category filtering correctly propagates
 * through the entire analytics computation pipeline:
 *
 * - filterTransactions with categoryIds
 * - Summary cards (computeSummary)
 * - All time series (daily, weekly, monthly, savings trend)
 * - Category breakdown & pie chart data
 * - Smart insights (no excluded categories referenced)
 * - Transaction rankings (largest/smallest)
 * - Spending patterns
 * - Monthly & yearly reports
 * - Heatmap
 * - Financial health
 * - Combined date + category filters
 * - Edge cases (empty, single category, all expense, all income, null category_id)
 * - Large dataset performance
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
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
} from '@/engines/analytics';
import type { Transaction } from '@/types';
import type { DateRange } from '@/types/analytics';

// ── Helpers ──────────────────────────────────────────────

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'txn-1',
    user_id: 'u1',
    category_id: 'cat-food',
    type: 'expense',
    amount: 100,
    notes: 'Test',
    date: '2024-06-15',
    created_at: '2024-06-15T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
    categories: {
      id: 'cat-food',
      user_id: 'u1',
      name: 'Food',
      type: 'expense',
      color: '#ef4444',
      icon: 'utensils',
      created_at: '',
      updated_at: '',
    },
    ...overrides,
  };
}

// ── Fixture data ─────────────────────────────────────────

const JUNE_RANGE: DateRange = { startDate: '2024-06-01', endDate: '2024-06-30' };
const NARROW_RANGE: DateRange = { startDate: '2024-06-01', endDate: '2024-06-10' };
const YEAR_RANGE: DateRange = { startDate: '2024-01-01', endDate: '2024-12-31' };

/**
 * Realistic dataset with multiple categories, types, and dates.
 */
const DIVERSE_TXNS: Transaction[] = [
  // Food — expense
  txn({ id: 't1', date: '2024-06-01', type: 'expense', amount: 100, category_id: 'cat-food',
    categories: { id: 'cat-food', user_id: 'u1', name: 'Food', type: 'expense', color: '#f00', icon: 'utensils', created_at: '', updated_at: '' } }),
  txn({ id: 't2', date: '2024-06-10', type: 'expense', amount: 50, category_id: 'cat-food',
    categories: { id: 'cat-food', user_id: 'u1', name: 'Food', type: 'expense', color: '#f00', icon: 'utensils', created_at: '', updated_at: '' } }),
  txn({ id: 't3', date: '2024-06-20', type: 'expense', amount: 75, category_id: 'cat-food',
    categories: { id: 'cat-food', user_id: 'u1', name: 'Food', type: 'expense', color: '#f00', icon: 'utensils', created_at: '', updated_at: '' } }),

  // Transport — expense
  txn({ id: 't4', date: '2024-06-05', type: 'expense', amount: 200, category_id: 'cat-transport',
    categories: { id: 'cat-transport', user_id: 'u1', name: 'Transport', type: 'expense', color: '#00f', icon: 'car', created_at: '', updated_at: '' } }),
  txn({ id: 't5', date: '2024-06-15', type: 'expense', amount: 150, category_id: 'cat-transport',
    categories: { id: 'cat-transport', user_id: 'u1', name: 'Transport', type: 'expense', color: '#00f', icon: 'car', created_at: '', updated_at: '' } }),

  // Entertainment — expense
  txn({ id: 't6', date: '2024-06-25', type: 'expense', amount: 300, category_id: 'cat-entertainment',
    categories: { id: 'cat-entertainment', user_id: 'u1', name: 'Entertainment', type: 'expense', color: '#800', icon: 'music', created_at: '', updated_at: '' } }),

  // Salary — income
  txn({ id: 't7', date: '2024-06-01', type: 'income', amount: 5000, category_id: 'cat-salary',
    categories: { id: 'cat-salary', user_id: 'u1', name: 'Salary', type: 'income', color: '#0f0', icon: 'wallet', created_at: '', updated_at: '' } }),

  // Freelance — income
  txn({ id: 't8', date: '2024-06-15', type: 'income', amount: 800, category_id: 'cat-freelance',
    categories: { id: 'cat-freelance', user_id: 'u1', name: 'Freelance', type: 'income', color: '#0ff', icon: 'briefcase', created_at: '', updated_at: '' } }),

  // Uncategorized transaction (null category_id)
  txn({ id: 't9', date: '2024-06-12', type: 'expense', amount: 25, category_id: null, categories: undefined }),
];

// Pre-filtered sets for convenience
function filterByCategories(txns: Transaction[], catIds: string[]): Transaction[] {
  const idSet = new Set(catIds);
  return txns.filter((t) => t.category_id !== null && idSet.has(t.category_id));
}

// ── filterTransactions with categoryIds ──────────────────

describe('filterTransactions — categoryIds integration', () => {
  it('single category filters correctly across date range', () => {
    const result = filterTransactions(DIVERSE_TXNS, JUNE_RANGE, { categoryIds: ['cat-food'] });
    expect(result).toHaveLength(3);
    expect(result.every((t) => t.category_id === 'cat-food')).toBe(true);
  });

  it('multiple categories aggregate correctly', () => {
    const result = filterTransactions(DIVERSE_TXNS, JUNE_RANGE, {
      categoryIds: ['cat-food', 'cat-transport'],
    });
    expect(result).toHaveLength(5); // 3 food + 2 transport
    const catIds = new Set(result.map((t) => t.category_id));
    expect(catIds).toEqual(new Set(['cat-food', 'cat-transport']));
  });

  it('empty categoryIds returns empty array', () => {
    const result = filterTransactions(DIVERSE_TXNS, JUNE_RANGE, { categoryIds: [] });
    expect(result).toHaveLength(0);
  });

  it('excludes null category_id transactions', () => {
    const result = filterTransactions(DIVERSE_TXNS, JUNE_RANGE, {
      categoryIds: ['cat-food', 'cat-transport'],
    });
    expect(result.some((t) => t.category_id === null)).toBe(false);
  });

  it('combined date + category restricts both dimensions', () => {
    // NARROW_RANGE is June 1-10, cat-food has t1 (June 1) and t2 (June 10)
    const result = filterTransactions(DIVERSE_TXNS, NARROW_RANGE, { categoryIds: ['cat-food'] });
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id).sort()).toEqual(['t1', 't2']);
  });

  it('combined date + category + type restricts all three', () => {
    // All income from Salary in June
    const result = filterTransactions(DIVERSE_TXNS, JUNE_RANGE, {
      categoryIds: ['cat-salary'],
      type: 'income',
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('t7');
  });

  it('non-existent categoryIds returns empty', () => {
    const result = filterTransactions(DIVERSE_TXNS, JUNE_RANGE, {
      categoryIds: ['cat-nonexistent'],
    });
    expect(result).toHaveLength(0);
  });

  it('undefined categoryIds does not filter categories', () => {
    const result = filterTransactions(DIVERSE_TXNS, JUNE_RANGE, { categoryIds: undefined });
    // All 9 transactions are in June
    expect(result).toHaveLength(9);
  });

  it('handles both categoryId (singular) and categoryIds (plural)', () => {
    // When both are provided, both filters should apply
    const result = filterTransactions(DIVERSE_TXNS, JUNE_RANGE, {
      categoryId: 'cat-food',
      categoryIds: ['cat-food', 'cat-transport'],
    });
    // categoryId: 'cat-food' AND categoryIds includes 'cat-food' → only cat-food passes both
    expect(result).toHaveLength(3);
    expect(result.every((t) => t.category_id === 'cat-food')).toBe(true);
  });
});

// ── Summary cards ────────────────────────────────────────

describe('Summary cards with category filter', () => {
  it('single category — Food only expenses, no income', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const summary = computeSummary(filtered, [], filtered, JUNE_RANGE);

    expect(summary.totalExpenses).toBe(225); // 100 + 50 + 75
    expect(summary.totalIncome).toBe(0);
    expect(summary.transactionCount).toBe(3);
    expect(summary.savings).toBe(-225);
    expect(summary.savingsRate).toBe(0); // no income
    expect(summary.highestExpense).toBe(100);
  });

  it('income category — Salary only', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-salary']);
    const summary = computeSummary(filtered, [], filtered, JUNE_RANGE);

    expect(summary.totalIncome).toBe(5000);
    expect(summary.totalExpenses).toBe(0);
    expect(summary.transactionCount).toBe(1);
    expect(summary.savings).toBe(5000);
    expect(summary.highestIncome).toBe(5000);
    expect(summary.highestExpense).toBe(0);
  });

  it('mixed expense + income categories', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food', 'cat-salary']);
    const summary = computeSummary(filtered, [], filtered, JUNE_RANGE);

    expect(summary.totalExpenses).toBe(225);
    expect(summary.totalIncome).toBe(5000);
    expect(summary.savings).toBe(4775);
    expect(summary.transactionCount).toBe(4); // 3 food + 1 salary
    expect(summary.savingsRate).toBe(96); // round((4775/5000)*100) = 96 (actually 95.5 → 96)
  });

  it('all expense categories aggregated correctly', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food', 'cat-transport', 'cat-entertainment']);
    const summary = computeSummary(filtered, [], filtered, JUNE_RANGE);

    expect(summary.totalExpenses).toBe(875); // 225 + 350 + 300
    expect(summary.transactionCount).toBe(6);
  });

  it('empty filter (no categories) produces zero summary', () => {
    const summary = computeSummary([], [], [], JUNE_RANGE);

    expect(summary.totalExpenses).toBe(0);
    expect(summary.totalIncome).toBe(0);
    expect(summary.transactionCount).toBe(0);
    expect(summary.savings).toBe(0);
    expect(summary.highestExpense).toBe(0);
    expect(summary.highestIncome).toBe(0);
  });

  it('currentBalance uses category-filtered allTransactions', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    // currentBalance = allIncome - allExpenses from the filtered set
    const summary = computeSummary(filtered, [], filtered, JUNE_RANGE);
    expect(summary.currentBalance).toBe(-225); // 0 income - 225 expenses
  });

  it('change percentages use category-filtered previous period', () => {
    const current = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const prevTxns = [
      txn({ id: 'p1', date: '2024-05-15', type: 'expense', amount: 200, category_id: 'cat-food' }),
    ];
    const summary = computeSummary(current, prevTxns, current, JUNE_RANGE);

    // Current expenses: 225, Previous: 200
    // Change: round((225-200)/200 * 100) = 13%
    expect(summary.expenseChange).toBe(13);
  });
});

// ── Time series charts ───────────────────────────────────

describe('Time series with category filter', () => {
  it('dailySeries totals match filtered expenses', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const series = computeDailySeries(filtered, JUNE_RANGE);

    const totalExpenses = series.reduce((s, p) => s + p.expenses, 0);
    const totalIncome = series.reduce((s, p) => s + p.income, 0);
    expect(totalExpenses).toBe(225);
    expect(totalIncome).toBe(0);
  });

  it('weeklySeries totals match filtered expenses', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const series = computeWeeklySeries(filtered, JUNE_RANGE);

    const totalExpenses = series.reduce((s, p) => s + p.expenses, 0);
    expect(totalExpenses).toBe(225);
  });

  it('monthlySeries totals match filtered expenses', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const series = computeMonthlySeries(filtered, JUNE_RANGE);

    const totalExpenses = series.reduce((s, p) => s + p.expenses, 0);
    expect(totalExpenses).toBe(225);
  });

  it('savingsTrend reflects category-filtered cumulative', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const trend = computeSavingsTrend(filtered, JUNE_RANGE);
    const lastNet = trend[trend.length - 1]?.net ?? 0;
    expect(lastNet).toBe(-225); // All expenses, no income
  });

  it('mixed categories show both income and expenses in series', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food', 'cat-salary']);
    const series = computeDailySeries(filtered, JUNE_RANGE);

    const totalExpenses = series.reduce((s, p) => s + p.expenses, 0);
    const totalIncome = series.reduce((s, p) => s + p.income, 0);
    expect(totalExpenses).toBe(225);
    expect(totalIncome).toBe(5000);
  });

  it('empty filter produces zero-value series', () => {
    const series = computeDailySeries([], JUNE_RANGE);
    expect(series.every((p) => p.income === 0 && p.expenses === 0)).toBe(true);
    expect(series.length).toBe(30); // June has 30 days
  });
});

// ── Category breakdown / pie chart data ──────────────────

describe('Category breakdown with category filter', () => {
  it('only includes filtered categories in breakdown', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food', 'cat-transport']);
    const breakdown = computeCategoryBreakdown(filtered, 'expense');

    expect(breakdown).toHaveLength(2);
    const names = breakdown.map((b) => b.name);
    expect(names).toContain('Food');
    expect(names).toContain('Transport');
    expect(names).not.toContain('Entertainment');
  });

  it('percentages sum to ~100 within filtered set', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food', 'cat-transport']);
    const breakdown = computeCategoryBreakdown(filtered, 'expense');

    const pctSum = breakdown.reduce((s, b) => s + b.percentage, 0);
    // Rounding may cause slight deviation
    expect(pctSum).toBeGreaterThanOrEqual(99);
    expect(pctSum).toBeLessThanOrEqual(101);
  });

  it('single category has 100% share', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const breakdown = computeCategoryBreakdown(filtered, 'expense');

    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]?.percentage).toBe(100);
    expect(breakdown[0]?.name).toBe('Food');
    expect(breakdown[0]?.count).toBe(3);
    expect(breakdown[0]?.amount).toBe(225);
  });

  it('income breakdown only shows income categories', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-salary', 'cat-freelance']);
    const breakdown = computeCategoryBreakdown(filtered, 'income');

    expect(breakdown).toHaveLength(2);
    expect(breakdown[0]?.name).toBe('Salary');
    expect(breakdown[1]?.name).toBe('Freelance');
  });

  it('empty filter produces empty breakdown', () => {
    const breakdown = computeCategoryBreakdown([], 'expense');
    expect(breakdown).toHaveLength(0);
  });

  it('avg, highest, lowest correctly computed per category', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const breakdown = computeCategoryBreakdown(filtered, 'expense');

    const food = breakdown[0];
    expect(food?.avgTransaction).toBe(75); // 225 / 3
    expect(food?.highestTransaction).toBe(100);
    expect(food?.lowestTransaction).toBe(50);
  });
});

// ── Smart Insights ───────────────────────────────────────

describe('Smart Insights with category filter', () => {
  it('top category insight reflects filtered data', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food', 'cat-transport']);
    const breakdown = computeCategoryBreakdown(filtered, 'expense');
    const summary = computeSummary(filtered, [], filtered, JUNE_RANGE);
    const insights = generateInsights(filtered, summary, breakdown, 'USD');

    // Transport (350) > Food (225), so Transport should be mentioned as top
    const topInsight = insights.find((i) => i.message.includes('spend most'));
    expect(topInsight?.message).toContain('Transport');
    expect(topInsight?.message).not.toContain('Entertainment');
  });

  it('no insight references excluded categories', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const breakdown = computeCategoryBreakdown(filtered, 'expense');
    const summary = computeSummary(filtered, [], filtered, JUNE_RANGE);
    const insights = generateInsights(filtered, summary, breakdown, 'USD');

    for (const insight of insights) {
      expect(insight.message).not.toContain('Transport');
      expect(insight.message).not.toContain('Entertainment');
      expect(insight.message).not.toContain('Salary');
      if (insight.detail) {
        expect(insight.detail).not.toContain('Transport');
        expect(insight.detail).not.toContain('Entertainment');
      }
    }
  });

  it('single category at 100% triggers tip insight', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const breakdown = computeCategoryBreakdown(filtered, 'expense');
    const summary = computeSummary(filtered, [], filtered, JUNE_RANGE);
    const insights = generateInsights(filtered, summary, breakdown, 'USD');

    // Food is 100% which is >= 35%
    const tipInsight = insights.find((i) => i.type === 'tip');
    expect(tipInsight).toBeDefined();
    expect(tipInsight?.message).toContain('Food');
    expect(tipInsight?.message).toContain('100%');
  });

  it('empty filter produces no insights', () => {
    const summary = computeSummary([], [], [], JUNE_RANGE);
    const insights = generateInsights([], summary, [], 'USD');
    expect(insights).toHaveLength(0);
  });
});

// ── Transaction rankings ─────────────────────────────────

describe('Transaction rankings with category filter', () => {
  it('largest transactions only from filtered categories', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const rankings = getTransactionRankings(filtered, 'largest');

    expect(rankings).toHaveLength(3);
    expect(rankings[0]?.amount).toBe(100);
    expect(rankings[1]?.amount).toBe(75);
    expect(rankings[2]?.amount).toBe(50);
    expect(rankings.every((r) => r.categoryName === 'Food')).toBe(true);
  });

  it('smallest transactions only from filtered categories', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const rankings = getTransactionRankings(filtered, 'smallest');

    expect(rankings[0]?.amount).toBe(50);
    expect(rankings[2]?.amount).toBe(100);
  });

  it('multi-category rankings include all filtered', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food', 'cat-entertainment']);
    const rankings = getTransactionRankings(filtered, 'largest');

    expect(rankings).toHaveLength(4); // 3 food + 1 entertainment
    expect(rankings[0]?.amount).toBe(300); // Entertainment
    expect(rankings[0]?.categoryName).toBe('Entertainment');
  });

  it('empty filter returns empty rankings', () => {
    const rankings = getTransactionRankings([], 'largest');
    expect(rankings).toHaveLength(0);
  });
});

// ── Spending patterns ────────────────────────────────────

describe('Spending patterns with category filter', () => {
  it('patterns reflect only filtered category spending', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const patterns = computeSpendingPatterns(filtered);

    const total = patterns.weekdayTotal + patterns.weekendTotal;
    expect(total).toBe(225); // All food transactions
  });

  it('income-only filter produces zero spending patterns', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-salary']);
    const patterns = computeSpendingPatterns(filtered);

    expect(patterns.weekdayTotal).toBe(0);
    expect(patterns.weekendTotal).toBe(0);
  });

  it('empty filter produces zero patterns', () => {
    const patterns = computeSpendingPatterns([]);
    expect(patterns.weekdayTotal).toBe(0);
    expect(patterns.weekendTotal).toBe(0);
    expect(patterns.weekdayAvg).toBe(0);
    expect(patterns.weekendAvg).toBe(0);
  });
});

// ── Monthly & yearly reports ─────────────────────────────

describe('Reports with category filter', () => {
  it('monthly report reflects filtered categories', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const report = computeMonthlyReport(filtered, [], 'June 2024');

    expect(report.totalExpenses).toBe(225);
    expect(report.totalIncome).toBe(0);
    expect(report.transactionCount).toBe(3);
    expect(report.biggestCategory).toBe('Food');
  });

  it('yearly report with filtered categories', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const report = computeYearlyReport(filtered, 2024);

    expect(report.totalExpenses).toBe(225);
    expect(report.totalIncome).toBe(0);
    expect(report.totalSavings).toBe(-225);
  });

  it('monthly report with no matching data', () => {
    const report = computeMonthlyReport([], [], 'June 2024');
    expect(report.totalExpenses).toBe(0);
    expect(report.totalIncome).toBe(0);
    expect(report.biggestCategory).toBe('N/A');
  });
});

// ── Heatmap ──────────────────────────────────────────────

describe('Heatmap with category filter', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2024-06-30T12:00:00')); });
  afterEach(() => { vi.useRealTimers(); });

  it('heatmap only includes filtered category expenses', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const heatmap = computeHeatmap(filtered);

    // Check specific dates
    const june1 = heatmap.find((d) => d.date === '2024-06-01');
    const june10 = heatmap.find((d) => d.date === '2024-06-10');
    const june20 = heatmap.find((d) => d.date === '2024-06-20');
    const june5 = heatmap.find((d) => d.date === '2024-06-05'); // Transport, excluded

    expect(june1?.amount).toBe(100);
    expect(june10?.amount).toBe(50);
    expect(june20?.amount).toBe(75);
    expect(june5?.amount).toBe(0); // Transport excluded
  });

  it('income-only filter produces empty heatmap', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-salary']);
    const heatmap = computeHeatmap(filtered);

    // Heatmap only counts expenses
    expect(heatmap.every((d) => d.amount === 0)).toBe(true);
  });

  it('empty filter produces empty heatmap', () => {
    const heatmap = computeHeatmap([]);
    expect(heatmap.every((d) => d.amount === 0)).toBe(true);
    expect(heatmap).toHaveLength(365);
  });
});

// ── Financial health ─────────────────────────────────────

describe('Financial health with category filter', () => {
  it('expense-only category produces poor health (no income)', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const summary = computeSummary(filtered, [], filtered, JUNE_RANGE);
    const health = computeFinancialHealth(summary);

    expect(health.grade).toBe('F');
    expect(health.label).toBe('Poor');
  });

  it('income + low-expense categories produce good health', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-salary', 'cat-food']);
    const summary = computeSummary(filtered, [], filtered, JUNE_RANGE);
    const health = computeFinancialHealth(summary);

    // Income 5000, Expenses 225, Savings rate 96%
    expect(health.score).toBeGreaterThanOrEqual(70);
    expect(['A', 'B']).toContain(health.grade);
  });
});

// ── Combined date + category scenarios ───────────────────

describe('Combined date + category filter scenarios', () => {
  it('Last 7 Days + Food', () => {
    const weekRange: DateRange = { startDate: '2024-06-09', endDate: '2024-06-15' };
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const result = filterTransactions(filtered, weekRange);

    // Food transactions in June 9-15: t2 (June 10)
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('t2');
  });

  it('This Month + Shopping (no matching category)', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-shopping']);
    const result = filterTransactions(filtered, JUNE_RANGE);
    expect(result).toHaveLength(0);
  });

  it('Last Month + multiple categories', () => {
    const mayRange: DateRange = { startDate: '2024-05-01', endDate: '2024-05-31' };
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food', 'cat-entertainment']);
    const result = filterTransactions(filtered, mayRange);
    // No transactions in May
    expect(result).toHaveLength(0);
  });

  it('This Year + Food + Transport + Entertainment', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food', 'cat-transport', 'cat-entertainment']);
    const result = filterTransactions(filtered, YEAR_RANGE);

    expect(result).toHaveLength(6); // 3 food + 2 transport + 1 entertainment
    const totalAmount = result.reduce((s, t) => s + Number(t.amount), 0);
    expect(totalAmount).toBe(875); // 225 + 350 + 300
  });

  it('switching date filter preserves category filter results', () => {
    const foodTxns = filterByCategories(DIVERSE_TXNS, ['cat-food']);

    // First: This Month
    const juneResult = filterTransactions(foodTxns, JUNE_RANGE);
    expect(juneResult).toHaveLength(3);

    // Switch to narrow range
    const narrowResult = filterTransactions(foodTxns, NARROW_RANGE);
    expect(narrowResult).toHaveLength(2); // t1 (June 1), t2 (June 10)

    // Back to full month
    const fullResult = filterTransactions(foodTxns, JUNE_RANGE);
    expect(fullResult).toHaveLength(3);
  });
});

// ── Edge cases ───────────────────────────────────────────

describe('Category filter edge cases', () => {
  it('transactions with null category_id excluded from all categoryIds filters', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-food', 'cat-transport', 'cat-entertainment', 'cat-salary', 'cat-freelance']);

    // t9 has null category_id — should be excluded
    expect(filtered).toHaveLength(8);
    expect(filtered.find((t) => t.id === 't9')).toBeUndefined();
  });

  it('category with no transactions produces empty results', () => {
    const filtered = filterByCategories(DIVERSE_TXNS, ['cat-bills']); // doesn't exist in data
    expect(filtered).toHaveLength(0);

    const summary = computeSummary(filtered, [], filtered, JUNE_RANGE);
    expect(summary.totalExpenses).toBe(0);
    expect(summary.transactionCount).toBe(0);
  });

  it('large dataset performance — filtering 10000 transactions', () => {
    const largeTxns: Transaction[] = Array.from({ length: 10000 }, (_, i) =>
      txn({
        id: `t-${i}`,
        date: `2024-06-${String((i % 28) + 1).padStart(2, '0')}`,
        type: i % 3 === 0 ? 'income' : 'expense',
        amount: Math.random() * 1000,
        category_id: `cat-${i % 5}`,
      }),
    );

    const start = performance.now();
    const filtered = filterByCategories(largeTxns, ['cat-0', 'cat-1']);
    const summary = computeSummary(filtered, [], filtered, JUNE_RANGE);
    computeCategoryBreakdown(filtered, 'expense');
    getTransactionRankings(filtered, 'largest', 10);
    const elapsed = performance.now() - start;

    // Should complete in under 100ms
    expect(elapsed).toBeLessThan(100);
    expect(filtered.length).toBeGreaterThan(0);
    expect(summary.transactionCount).toBe(filtered.length);
  });

  it('rapid filter changes produce consistent results', () => {
    // Simulate toggling through categories
    const catIds = ['cat-food', 'cat-transport', 'cat-entertainment', 'cat-salary', 'cat-freelance'];

    for (let i = 0; i < catIds.length; i++) {
      const selectedIds = catIds.slice(0, i + 1);
      const filtered = filterByCategories(DIVERSE_TXNS, selectedIds);
      const summary = computeSummary(filtered, [], filtered, JUNE_RANGE);

      // Verify consistency: transactionCount should match filtered length
      expect(summary.transactionCount).toBe(
        filterTransactions(filtered, JUNE_RANGE).length,
      );
    }
  });
});

// ── Full pipeline integration ────────────────────────────

describe('Full analytics pipeline with category filter', () => {
  it('complete pipeline: Food only', () => {
    const base = filterByCategories(DIVERSE_TXNS, ['cat-food']);
    const current = filterTransactions(base, JUNE_RANGE);
    const summary = computeSummary(current, [], base, JUNE_RANGE);
    const breakdown = computeCategoryBreakdown(current, 'expense');
    const rankings = getTransactionRankings(current, 'largest');
    const insights = generateInsights(current, summary, breakdown, 'USD');
    const patterns = computeSpendingPatterns(current);

    // Cross-check everything
    expect(summary.totalExpenses).toBe(225);
    expect(summary.transactionCount).toBe(3);
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]?.name).toBe('Food');
    expect(rankings).toHaveLength(3);
    expect(patterns.weekdayTotal + patterns.weekendTotal).toBe(225);

    // Insights should only reference Food
    for (const insight of insights) {
      expect(insight.message).not.toContain('Transport');
      expect(insight.message).not.toContain('Entertainment');
    }
  });

  it('complete pipeline: all categories (no filter)', () => {
    const current = filterTransactions(DIVERSE_TXNS, JUNE_RANGE);
    const summary = computeSummary(current, [], DIVERSE_TXNS, JUNE_RANGE);
    const breakdown = computeCategoryBreakdown(current, 'expense');

    expect(summary.totalExpenses).toBe(900); // 225 + 350 + 300 + 25 (uncategorized)
    expect(summary.totalIncome).toBe(5800); // 5000 + 800
    expect(summary.transactionCount).toBe(9);

    // Breakdown should include Uncategorized
    const names = breakdown.map((b) => b.name);
    expect(names).toContain('Uncategorized');
    expect(breakdown.length).toBe(4); // Food, Transport, Entertainment, Uncategorized
  });

  it('complete pipeline: empty filter ([] categories)', () => {
    const current = filterTransactions([], JUNE_RANGE);
    const summary = computeSummary(current, [], [], JUNE_RANGE);
    const breakdown = computeCategoryBreakdown(current, 'expense');
    const rankings = getTransactionRankings(current, 'largest');
    const insights = generateInsights(current, summary, breakdown, 'USD');
    const report = computeMonthlyReport(current, [], 'June 2024');

    expect(summary.totalExpenses).toBe(0);
    expect(summary.totalIncome).toBe(0);
    expect(breakdown).toHaveLength(0);
    expect(rankings).toHaveLength(0);
    expect(insights).toHaveLength(0);
    expect(report.totalExpenses).toBe(0);
  });
});


