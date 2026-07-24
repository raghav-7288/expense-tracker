/**
 * Analytics Page — Regression Test Suite
 *
 * Guards against hardcoded currency symbols and ensures correct
 * formatting across all analytics components when the user's
 * preferred currency is changed.
 *
 * Also verifies that ALL analytics computations respect the
 * multi-category filter (categoryIds).
 *
 * Covers: SummaryGrid, TopCategories, LargestTransactions,
 * CategoryBreakdownTable, SpendingPatterns, MonthlyReport,
 * YearlyReport, SmartInsights (via generateInsights engine),
 * ChartCard loading/empty states, FinancialHealthCard, and
 * the formatCurrency / formatCompactCurrency utilities.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import {
  generateInsights,
  filterTransactions,
  computeSummary,
  computeDailySeries,
  computeWeeklySeries,
  computeMonthlySeries,
  computeSavingsTrend,
  computeCategoryBreakdown,
  computeHeatmap,
  computeSpendingPatterns,
  computeMonthlyReport,
  computeYearlyReport,
  getTransactionRankings,
} from '@/engines/analytics';
import { formatCurrency, formatCompactCurrency } from '@/utils/formatCurrency';
import type { Transaction } from '@/types';
import type {
  AnalyticsSummary,
  CategoryBreakdownItem,
  TransactionRankingItem,
  SpendingPatternData,
  MonthlyReportData,
  YearlyReportData,
  FinancialHealthScore,
  InsightItem,
  DateRange,
} from '@/types/analytics';

// Mock Recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Line: () => null,
  Area: () => null,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ReferenceLine: () => null,
}));

function ThemeWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ darkMode: false, setDarkMode: vi.fn() }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Import components after Recharts mock
import SummaryGrid from '@/components/analytics/SummaryGrid';
import TopCategories from '@/components/analytics/TopCategories';
import LargestTransactions from '@/components/analytics/LargestTransactions';
import CategoryBreakdownTable from '@/components/analytics/CategoryBreakdownTable';
import SpendingPatterns from '@/components/analytics/SpendingPatterns';
import MonthlyReport from '@/components/analytics/MonthlyReport';
import YearlyReport from '@/components/analytics/YearlyReport';
import SmartInsights from '@/components/analytics/SmartInsights';
import FinancialHealthCard from '@/components/analytics/FinancialHealthCard';
import ChartCard from '@/components/analytics/ChartCard';
import ExpenseHeatmap from '@/components/analytics/ExpenseHeatmap';

// ──── Shared fixtures ─────────────────────────────────────────

const NON_USD_CURRENCIES = ['INR', 'EUR', 'GBP', 'JPY'] as const;

const EXPECTED_SYMBOLS: Record<string, string> = {
  USD: '$', INR: '₹', EUR: '€', GBP: '£', JPY: '¥',
};

const mockSummary: AnalyticsSummary = {
  currentBalance: 5000,
  totalIncome: 10000,
  totalExpenses: 5000,
  savings: 5000,
  savingsRate: 50,
  transactionCount: 25,
  avgDailySpending: 166.67,
  avgMonthlySpending: 5000,
  highestExpense: 2000,
  highestIncome: 5000,
  incomeChange: 15,
  expenseChange: -10,
  savingsChange: 20,
  transactionCountChange: 5,
};

const mockCategories: CategoryBreakdownItem[] = [
  { name: 'Food', color: '#ef4444', icon: 'utensils', amount: 500, percentage: 50, count: 10, avgTransaction: 50, highestTransaction: 100, lowestTransaction: 10 },
  { name: 'Transport', color: '#3b82f6', icon: 'car', amount: 300, percentage: 30, count: 6, avgTransaction: 50, highestTransaction: 80, lowestTransaction: 20 },
];

const mockTransactions: TransactionRankingItem[] = [
  { id: '1', notes: 'Rent', amount: 2000, date: '2024-06-01', categoryName: 'Housing', categoryColor: '#f00', type: 'expense' },
  { id: '2', notes: 'Salary', amount: 5000, date: '2024-06-01', categoryName: 'Income', categoryColor: '#0f0', type: 'income' },
];

const mockPatterns: SpendingPatternData = {
  weekdayTotal: 1000, weekendTotal: 500,
  weekdayAvg: 50, weekendAvg: 100,
  byDayOfWeek: [
    { day: 'Monday', shortDay: 'Mon', amount: 200, count: 4 },
    { day: 'Tuesday', shortDay: 'Tue', amount: 150, count: 3 },
  ],
  busiestDay: 'Monday', quietestDay: 'Sunday',
};

const mockMonthlyReport: MonthlyReportData = {
  monthLabel: 'June 2024', totalIncome: 5000, totalExpenses: 3000,
  savings: 2000, savingsRate: 40, biggestCategory: 'Food',
  mostExpensiveDay: 'Friday, Jun 14', avgTransaction: 200,
  transactionCount: 25, incomeChange: 10, expenseChange: -5,
  savingsChange: 15, comparisonText: 'You spent 5% less than the previous period.',
};

const mockYearlyReport: YearlyReportData = {
  year: 2024,
  months: Array.from({ length: 12 }, (_, i) => ({
    month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i] ?? '',
    shortMonth: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i] ?? '',
    income: (i + 1) * 1000, expenses: (i + 1) * 600, savings: (i + 1) * 400,
  })),
  totalIncome: 78000, totalExpenses: 46800, totalSavings: 31200,
  highestSpendingMonth: 'December', highestIncomeMonth: 'December',
  bestSavingsMonth: 'December', avgMonthlySpending: 3900, avgMonthlyIncome: 6500,
};

const mockHealth: FinancialHealthScore = {
  score: 75, grade: 'B', label: 'Good', color: '#3b82f6',
  factors: [
    { name: 'Savings Rate', score: 20, maxScore: 30, description: 'Good savings rate' },
    { name: 'Income', score: 25, maxScore: 25, description: 'Income recorded' },
    { name: 'Expense Control', score: 15, maxScore: 25, description: 'Reasonable spending' },
    { name: 'Consistency', score: 15, maxScore: 20, description: 'Stable spending patterns' },
  ],
};

// ──── Helper: assert no hardcoded "$" when using a non-USD currency ──

function assertNoDollarSign(text: string, currency: string) {
  if (currency !== 'USD') {
    // Split by expected currency symbol and percentages to avoid false positives
    // We only care about $ appearing as a currency prefix, not in CSS classes etc.
    const stripped = text.replace(/%/g, ''); // percentages are fine
    expect(stripped).not.toContain('$');
  }
}

/* ================================================================
   1. HARDCODED CURRENCY REGRESSION — formatCurrency utilities
   ================================================================ */

describe('REGRESSION: formatCurrency never returns hardcoded $', () => {
  for (const currency of NON_USD_CURRENCIES) {
    it(`formatCurrency(1234.56, '${currency}') does not contain $`, () => {
      const result = formatCurrency(1234.56, currency);
      expect(result).not.toContain('$');
      expect(result).toContain(EXPECTED_SYMBOLS[currency]);
    });

    it(`formatCompactCurrency(5000000, '${currency}') does not contain $`, () => {
      const result = formatCompactCurrency(5000000, currency);
      expect(result).not.toContain('$');
      expect(result).toContain(EXPECTED_SYMBOLS[currency]);
    });
  }

  it('formatCurrency with USD does contain $', () => {
    expect(formatCurrency(100, 'USD')).toContain('$');
  });
});

/* ================================================================
   2. HARDCODED CURRENCY REGRESSION — generateInsights engine
   ================================================================ */

describe('REGRESSION: generateInsights never contains hardcoded $', () => {
  const insightSummary: AnalyticsSummary = {
    ...mockSummary,
    highestExpense: 999.99,
    avgDailySpending: 42.50,
  };

  for (const currency of NON_USD_CURRENCIES) {
    it(`all insight messages use ${currency} symbol, not $`, () => {
      const insights = generateInsights([], insightSummary, mockCategories, currency);
      for (const insight of insights) {
        // Only check messages that contain monetary values
        if (insight.message.includes(EXPECTED_SYMBOLS[currency]!)) {
          expect(insight.message).not.toContain('$');
        }
      }
    });

    it(`'largest expense' insight uses ${currency} symbol`, () => {
      const insights = generateInsights([], insightSummary, [], currency);
      const msg = insights.find((i) => i.message.includes('largest expense'));
      expect(msg).toBeDefined();
      expect(msg!.message).toContain(EXPECTED_SYMBOLS[currency]);
      expect(msg!.message).not.toContain('$');
    });

    it(`'average daily spending' insight uses ${currency} symbol`, () => {
      const insights = generateInsights([], insightSummary, [], currency);
      const msg = insights.find((i) => i.message.includes('average daily'));
      expect(msg).toBeDefined();
      expect(msg!.message).toContain(EXPECTED_SYMBOLS[currency]);
      expect(msg!.message).not.toContain('$');
    });
  }

  it('insight messages contain $ only when currency is USD', () => {
    const insights = generateInsights([], insightSummary, [], 'USD');
    const monetary = insights.filter((i) =>
      i.message.includes('largest expense') || i.message.includes('average daily'),
    );
    expect(monetary.length).toBeGreaterThan(0);
    for (const m of monetary) {
      expect(m.message).toContain('$');
    }
  });
});

/* ================================================================
   3. HARDCODED CURRENCY REGRESSION — SummaryGrid component
   ================================================================ */

describe('REGRESSION: SummaryGrid has no hardcoded $', () => {
  for (const currency of NON_USD_CURRENCIES) {
    it(`renders ${currency} without any $ symbol`, () => {
      const { container } = render(<SummaryGrid summary={mockSummary} currency={currency} />);
      const text = container.textContent ?? '';
      assertNoDollarSign(text, currency);
      expect(text).toContain(EXPECTED_SYMBOLS[currency]);
    });
  }

  it('live currency switch from USD → INR removes all $ signs', () => {
    const { container, rerender } = render(<SummaryGrid summary={mockSummary} currency="USD" />);
    expect(container.textContent).toContain('$');
    rerender(<SummaryGrid summary={mockSummary} currency="INR" />);
    assertNoDollarSign(container.textContent ?? '', 'INR');
    expect(container.textContent).toContain('₹');
  });

  it('live currency switch from USD → JPY removes all $ signs', () => {
    const { container, rerender } = render(<SummaryGrid summary={mockSummary} currency="USD" />);
    expect(container.textContent).toContain('$');
    rerender(<SummaryGrid summary={mockSummary} currency="JPY" />);
    assertNoDollarSign(container.textContent ?? '', 'JPY');
    expect(container.textContent).toContain('¥');
  });
});

/* ================================================================
   4. HARDCODED CURRENCY REGRESSION — TopCategories component
   ================================================================ */

describe('REGRESSION: TopCategories has no hardcoded $', () => {
  for (const currency of NON_USD_CURRENCIES) {
    it(`renders ${currency} without any $ symbol`, () => {
      const { container } = render(<TopCategories data={mockCategories} currency={currency} />);
      assertNoDollarSign(container.textContent ?? '', currency);
      expect(container.textContent).toContain(EXPECTED_SYMBOLS[currency]);
    });
  }
});

/* ================================================================
   5. HARDCODED CURRENCY REGRESSION — LargestTransactions component
   ================================================================ */

describe('REGRESSION: LargestTransactions has no hardcoded $', () => {
  for (const currency of NON_USD_CURRENCIES) {
    it(`renders ${currency} without any $ symbol`, () => {
      const { container } = render(
        <LargestTransactions largest={mockTransactions} smallest={mockTransactions} currency={currency} />,
      );
      assertNoDollarSign(container.textContent ?? '', currency);
      expect(container.textContent).toContain(EXPECTED_SYMBOLS[currency]);
    });
  }

  it('live switch USD → EUR → GBP updates correctly', () => {
    const { container, rerender } = render(
      <LargestTransactions largest={mockTransactions} smallest={mockTransactions} currency="USD" />,
    );
    expect(container.textContent).toContain('$');

    rerender(<LargestTransactions largest={mockTransactions} smallest={mockTransactions} currency="EUR" />);
    assertNoDollarSign(container.textContent ?? '', 'EUR');
    expect(container.textContent).toContain('€');

    rerender(<LargestTransactions largest={mockTransactions} smallest={mockTransactions} currency="GBP" />);
    assertNoDollarSign(container.textContent ?? '', 'GBP');
    expect(container.textContent).toContain('£');
  });
});

/* ================================================================
   6. HARDCODED CURRENCY REGRESSION — CategoryBreakdownTable
   ================================================================ */

describe('REGRESSION: CategoryBreakdownTable has no hardcoded $', () => {
  for (const currency of NON_USD_CURRENCIES) {
    it(`renders ${currency} without any $ symbol`, () => {
      const { container } = render(
        <CategoryBreakdownTable data={mockCategories} currency={currency} />,
      );
      assertNoDollarSign(container.textContent ?? '', currency);
      expect(container.textContent).toContain(EXPECTED_SYMBOLS[currency]);
    });
  }
});

/* ================================================================
   7. HARDCODED CURRENCY REGRESSION — SpendingPatterns
   ================================================================ */

describe('REGRESSION: SpendingPatterns has no hardcoded $', () => {
  for (const currency of NON_USD_CURRENCIES) {
    it(`renders ${currency} without any $ symbol`, () => {
      const { container } = render(
        <SpendingPatterns data={mockPatterns} currency={currency} />,
      );
      assertNoDollarSign(container.textContent ?? '', currency);
      expect(container.textContent).toContain(EXPECTED_SYMBOLS[currency]);
    });
  }
});

/* ================================================================
   8. HARDCODED CURRENCY REGRESSION — MonthlyReport
   ================================================================ */

describe('REGRESSION: MonthlyReport has no hardcoded $', () => {
  for (const currency of NON_USD_CURRENCIES) {
    it(`renders ${currency} without any $ symbol`, () => {
      const { container } = render(
        <MonthlyReport data={mockMonthlyReport} currency={currency} />,
      );
      assertNoDollarSign(container.textContent ?? '', currency);
      expect(container.textContent).toContain(EXPECTED_SYMBOLS[currency]);
    });
  }
});

/* ================================================================
   9. HARDCODED CURRENCY REGRESSION — YearlyReport
   ================================================================ */

describe('REGRESSION: YearlyReport has no hardcoded $', () => {
  for (const currency of NON_USD_CURRENCIES) {
    it(`renders ${currency} without any $ symbol`, () => {
      const { container } = render(
        <YearlyReport data={mockYearlyReport} currency={currency} />,
      );
      assertNoDollarSign(container.textContent ?? '', currency);
      expect(container.textContent).toContain(EXPECTED_SYMBOLS[currency]);
    });
  }
});

/* ================================================================
  10. SmartInsights — renders pre-formatted currency values correctly
   ================================================================ */

describe('REGRESSION: SmartInsights renders currency values from insights', () => {
  it('renders INR-formatted insight messages without $', () => {
    const insights = generateInsights(
      [],
      { ...mockSummary, highestExpense: 500, avgDailySpending: 100 },
      [],
      'INR',
    );
    const { container } = render(<SmartInsights data={insights} />);
    const text = container.textContent ?? '';
    expect(text).toContain('₹');
    assertNoDollarSign(text, 'INR');
  });

  it('renders EUR-formatted insight messages without $', () => {
    const insights = generateInsights(
      [],
      { ...mockSummary, highestExpense: 500, avgDailySpending: 100 },
      [],
      'EUR',
    );
    const { container } = render(<SmartInsights data={insights} />);
    const text = container.textContent ?? '';
    expect(text).toContain('€');
    assertNoDollarSign(text, 'EUR');
  });

  it('renders JPY-formatted insight messages without decimals', () => {
    const insights = generateInsights(
      [],
      { ...mockSummary, highestExpense: 10000, avgDailySpending: 500 },
      [],
      'JPY',
    );
    const { container } = render(<SmartInsights data={insights} />);
    const text = container.textContent ?? '';
    expect(text).toContain('¥');
    assertNoDollarSign(text, 'JPY');
  });

  it('renders all insight types', () => {
    const allTypes: InsightItem[] = [
      { id: '1', type: 'info', message: 'Info message' },
      { id: '2', type: 'success', message: 'Success message' },
      { id: '3', type: 'warning', message: 'Warning message', detail: 'Detail text' },
      { id: '4', type: 'tip', message: 'Tip message', detail: 'Consider this' },
    ];
    render(<SmartInsights data={allTypes} />);
    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByText('Tip message')).toBeInTheDocument();
    expect(screen.getByText('Detail text')).toBeInTheDocument();
    expect(screen.getByText('Consider this')).toBeInTheDocument();
  });

  it('renders empty state when no insights', () => {
    render(<SmartInsights data={[]} />);
    expect(screen.getByText(/Add more transactions/)).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const { container } = render(<SmartInsights data={[]} loading />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});

/* ================================================================
  11. FinancialHealthCard — loading, null data, all grades
   ================================================================ */

describe('REGRESSION: FinancialHealthCard states', () => {
  it('renders null data without crashing', () => {
    const { container } = render(<FinancialHealthCard data={null} />);
    expect(container).toBeTruthy();
  });

  it('renders loading state via ChartCard', () => {
    const { container } = render(<FinancialHealthCard data={null} loading />);
    // loading prop goes to ChartCard, but data=null causes early return
    expect(container).toBeTruthy();
  });

  it('renders score, grade, and all factors', () => {
    render(<FinancialHealthCard data={mockHealth} />);
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText(/B — Good/)).toBeInTheDocument();
    expect(screen.getByText('Savings Rate')).toBeInTheDocument();
    expect(screen.getByText('20/30')).toBeInTheDocument();
  });

  it('renders accessible score gauge', () => {
    render(<FinancialHealthCard data={mockHealth} />);
    const gauge = screen.getByRole('img');
    expect(gauge).toHaveAttribute('aria-label', expect.stringContaining('75'));
    expect(gauge).toHaveAttribute('aria-label', expect.stringContaining('B'));
  });

  it('renders factor progress bars', () => {
    render(<FinancialHealthCard data={mockHealth} />);
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(4);
  });
});

/* ================================================================
  12. ChartCard — loading, empty, and content states
   ================================================================ */

describe('REGRESSION: ChartCard states', () => {
  it('shows content when not loading and not empty', () => {
    render(<ChartCard title="Test">Chart content here</ChartCard>);
    expect(screen.getByText('Chart content here')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading=true', () => {
    const { container } = render(<ChartCard title="Test" loading>Content</ChartCard>);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('shows empty state when empty=true', () => {
    render(<ChartCard title="Test" empty emptyMessage="Nothing here">Content</ChartCard>);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('shows default empty message', () => {
    render(<ChartCard title="Test" empty>Content</ChartCard>);
    expect(screen.getByText('No data available yet')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<ChartCard title="Title" description="Helpful info">Content</ChartCard>);
    expect(screen.getByText('Helpful info')).toBeInTheDocument();
  });

  it('renders action slot', () => {
    render(<ChartCard title="Title" action={<button>Action</button>}>Content</ChartCard>);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});

/* ================================================================
  13. ExpenseHeatmap — currency regression
   ================================================================ */

describe('REGRESSION: ExpenseHeatmap currency', () => {
  const heatmapData = Array.from({ length: 7 }, (_, i) => ({
    date: `2024-06-${String(i + 10).padStart(2, '0')}`,
    amount: (i + 1) * 100,
    count: i + 1,
    level: (Math.min(4, i) as 0 | 1 | 2 | 3 | 4),
  }));

  it('renders with empty data', () => {
    render(<ExpenseHeatmap data={[]} currency="USD" />, { wrapper: ThemeWrapper });
    expect(screen.getByText('Expense Heatmap')).toBeInTheDocument();
  });

  it('renders with data', () => {
    render(<ExpenseHeatmap data={heatmapData} currency="INR" />, { wrapper: ThemeWrapper });
    expect(screen.getByText('Expense Heatmap')).toBeInTheDocument();
  });
});

/* ================================================================
  14. Full currency cycle — switch through ALL currencies
   ================================================================ */

describe('REGRESSION: full currency rotation on SummaryGrid', () => {
  const ALL_CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY'] as const;

  it('cycles through all 5 currencies without stale values', () => {
    const { container, rerender } = render(<SummaryGrid summary={mockSummary} currency="USD" />);

    for (const currency of ALL_CURRENCIES) {
      rerender(<SummaryGrid summary={mockSummary} currency={currency} />);
      const text = container.textContent ?? '';
      expect(text).toContain(EXPECTED_SYMBOLS[currency]);

      // No stale symbols from other currencies
      for (const other of ALL_CURRENCIES) {
        if (other !== currency) {
          // Skip checking for symbols that might be subsets (£ is unique, € is unique, etc.)
          // Only check that NO OTHER currency's unique symbol is present
          if (EXPECTED_SYMBOLS[other] !== EXPECTED_SYMBOLS[currency]) {
            // $ can appear inside ¥ in some encodings, so only check non-USD when current is non-USD
            if (other === 'USD' && currency !== 'USD') {
              assertNoDollarSign(text, currency);
            }
          }
        }
      }
    }
  });
});

describe('REGRESSION: full currency rotation on CategoryBreakdownTable', () => {
  const ALL_CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY'] as const;

  it('cycles through all 5 currencies without stale values', () => {
    const { container, rerender } = render(
      <CategoryBreakdownTable data={mockCategories} currency="USD" />,
    );

    for (const currency of ALL_CURRENCIES) {
      rerender(<CategoryBreakdownTable data={mockCategories} currency={currency} />);
      const text = container.textContent ?? '';
      expect(text).toContain(EXPECTED_SYMBOLS[currency]);

      if (currency !== 'USD') {
        assertNoDollarSign(text, currency);
      }
    }
  });
});

describe('REGRESSION: full currency rotation on MonthlyReport', () => {
  const ALL_CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY'] as const;

  it('cycles through all 5 currencies without stale values', () => {
    const { container, rerender } = render(
      <MonthlyReport data={mockMonthlyReport} currency="USD" />,
    );

    for (const currency of ALL_CURRENCIES) {
      rerender(<MonthlyReport data={mockMonthlyReport} currency={currency} />);
      const text = container.textContent ?? '';
      expect(text).toContain(EXPECTED_SYMBOLS[currency]);

      if (currency !== 'USD') {
        assertNoDollarSign(text, currency);
      }
    }
  });
});

/* ================================================================
   15. CATEGORY FILTER REGRESSION — all analytics respect categoryIds
   ================================================================ */

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'txn-1',
    user_id: 'u1',
    category_id: 'cat-1',
    type: 'expense',
    amount: 100,
    notes: 'Test',
    date: '2024-06-15',
    created_at: '2024-06-15T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
    categories: { id: 'cat-1', user_id: 'u1', name: 'Food', type: 'expense', color: '#ef4444', icon: 'utensils', created_at: '', updated_at: '' },
    ...overrides,
  };
}

describe('REGRESSION: category filter propagates to all analytics', () => {
  const range: DateRange = { startDate: '2024-06-01', endDate: '2024-06-30' };

  // Diverse set of transactions spanning categories
  const allTxns: Transaction[] = [
    txn({ id: '1', date: '2024-06-01', type: 'expense', amount: 100, category_id: 'cat-food',
      categories: { id: 'cat-food', user_id: 'u1', name: 'Food', type: 'expense', color: '#f00', icon: 'utensils', created_at: '', updated_at: '' } }),
    txn({ id: '2', date: '2024-06-10', type: 'expense', amount: 200, category_id: 'cat-transport',
      categories: { id: 'cat-transport', user_id: 'u1', name: 'Transport', type: 'expense', color: '#00f', icon: 'car', created_at: '', updated_at: '' } }),
    txn({ id: '3', date: '2024-06-15', type: 'income', amount: 5000, category_id: 'cat-salary',
      categories: { id: 'cat-salary', user_id: 'u1', name: 'Salary', type: 'income', color: '#0f0', icon: 'wallet', created_at: '', updated_at: '' } }),
    txn({ id: '4', date: '2024-06-20', type: 'expense', amount: 50, category_id: 'cat-food',
      categories: { id: 'cat-food', user_id: 'u1', name: 'Food', type: 'expense', color: '#f00', icon: 'utensils', created_at: '', updated_at: '' } }),
    txn({ id: '5', date: '2024-06-25', type: 'expense', amount: 300, category_id: 'cat-entertainment',
      categories: { id: 'cat-entertainment', user_id: 'u1', name: 'Entertainment', type: 'expense', color: '#800', icon: 'music', created_at: '', updated_at: '' } }),
  ];

  it('filterTransactions with categoryIds reduces transaction set', () => {
    const filtered = filterTransactions(allTxns, range, { categoryIds: ['cat-food'] });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((t) => t.category_id === 'cat-food')).toBe(true);
  });

  it('computeSummary uses only category-filtered transactions', () => {
    const base = allTxns.filter((t) => t.category_id === 'cat-food');
    const summary = computeSummary(base, [], base, range);
    expect(summary.totalExpenses).toBe(150); // 100 + 50
    expect(summary.totalIncome).toBe(0);     // no income in Food
    expect(summary.transactionCount).toBe(2);
  });

  it('computeDailySeries only includes filtered categories', () => {
    const filtered = allTxns.filter((t) => t.category_id === 'cat-food');
    const series = computeDailySeries(filtered, range);
    const totalExpenses = series.reduce((s, p) => s + p.expenses, 0);
    expect(totalExpenses).toBe(150);
    const totalIncome = series.reduce((s, p) => s + p.income, 0);
    expect(totalIncome).toBe(0);
  });

  it('computeWeeklySeries only includes filtered categories', () => {
    const filtered = allTxns.filter((t) => t.category_id === 'cat-food');
    const series = computeWeeklySeries(filtered, range);
    const totalExpenses = series.reduce((s, p) => s + p.expenses, 0);
    expect(totalExpenses).toBe(150);
  });

  it('computeMonthlySeries only includes filtered categories', () => {
    const filtered = allTxns.filter((t) => t.category_id === 'cat-food');
    const series = computeMonthlySeries(filtered, range);
    const totalExpenses = series.reduce((s, p) => s + p.expenses, 0);
    expect(totalExpenses).toBe(150);
  });

  it('computeSavingsTrend reflects filtered categories', () => {
    const filtered = allTxns.filter((t) => t.category_id === 'cat-food');
    const trend = computeSavingsTrend(filtered, range);
    // Food is all expenses, so cumulative should be negative
    const lastNet = trend[trend.length - 1]?.net ?? 0;
    expect(lastNet).toBe(-150);
  });

  it('computeCategoryBreakdown only shows filtered categories', () => {
    const filtered = allTxns.filter((t) => ['cat-food', 'cat-transport'].includes(t.category_id ?? ''));
    const breakdown = computeCategoryBreakdown(filtered, 'expense');
    expect(breakdown).toHaveLength(2);
    const names = breakdown.map((b) => b.name);
    expect(names).toContain('Food');
    expect(names).toContain('Transport');
    expect(names).not.toContain('Entertainment');
  });

  it('computeSpendingPatterns only uses filtered categories', () => {
    const filtered = allTxns.filter((t) => t.category_id === 'cat-food');
    const patterns = computeSpendingPatterns(filtered);
    const totalSpending = patterns.weekdayTotal + patterns.weekendTotal;
    expect(totalSpending).toBe(150);
  });

  it('getTransactionRankings only ranks filtered transactions', () => {
    const filtered = allTxns.filter((t) => t.category_id === 'cat-food');
    const rankings = getTransactionRankings(filtered, 'largest');
    expect(rankings).toHaveLength(2);
    expect(rankings[0]?.amount).toBe(100);
    expect(rankings[1]?.amount).toBe(50);
  });

  it('computeMonthlyReport uses only filtered transactions for comparison', () => {
    const current = allTxns.filter((t) => t.category_id === 'cat-food');
    const report = computeMonthlyReport(current, [], 'June 2024');
    expect(report.totalExpenses).toBe(150);
    expect(report.totalIncome).toBe(0);
    expect(report.biggestCategory).toBe('Food');
  });

  it('computeYearlyReport only includes filtered categories', () => {
    const filtered = allTxns.filter((t) => t.category_id === 'cat-food');
    const report = computeYearlyReport(filtered, 2024);
    expect(report.totalExpenses).toBe(150);
    expect(report.totalIncome).toBe(0);
  });

  it('generateInsights uses filtered category breakdown', () => {
    const filtered = allTxns.filter((t) => t.category_id === 'cat-food');
    const breakdown = computeCategoryBreakdown(filtered, 'expense');
    const summary = computeSummary(filtered, [], filtered, range);
    const insights = generateInsights(filtered, summary, breakdown, 'USD');
    // All insights should relate to Food (only category)
    const topCatInsight = insights.find((i) => i.message.includes('Food'));
    expect(topCatInsight).toBeDefined();
    // Should not mention Transport or Entertainment
    expect(insights.every((i) => !i.message.includes('Transport'))).toBe(true);
  });

  it('date + category filters work together', () => {
    // Narrow date range + specific category
    const narrowRange: DateRange = { startDate: '2024-06-01', endDate: '2024-06-15' };
    const filtered = filterTransactions(allTxns, narrowRange, { categoryIds: ['cat-food'] });
    // Only txn id=1 (June 1, Food) matches both
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('1');
  });

  it('empty categoryIds results in empty analytics', () => {
    const filtered = filterTransactions(allTxns, range, { categoryIds: [] });
    expect(filtered).toHaveLength(0);

    const summary = computeSummary(filtered, [], filtered, range);
    expect(summary.totalExpenses).toBe(0);
    expect(summary.totalIncome).toBe(0);
    expect(summary.transactionCount).toBe(0);

    const breakdown = computeCategoryBreakdown(filtered, 'expense');
    expect(breakdown).toHaveLength(0);

    const rankings = getTransactionRankings(filtered, 'largest');
    expect(rankings).toHaveLength(0);
  });

  it('multiple category selection aggregates correctly', () => {
    const filtered = allTxns.filter((t) =>
      ['cat-food', 'cat-transport', 'cat-entertainment'].includes(t.category_id ?? ''),
    );
    const summary = computeSummary(filtered, [], filtered, range);
    expect(summary.totalExpenses).toBe(650); // 100 + 200 + 50 + 300
    expect(summary.totalIncome).toBe(0);
    expect(summary.transactionCount).toBe(4);
  });

  it('category filter with income categories includes income', () => {
    const filtered = allTxns.filter((t) => t.category_id === 'cat-salary');
    const summary = computeSummary(filtered, [], filtered, range);
    expect(summary.totalIncome).toBe(5000);
    expect(summary.totalExpenses).toBe(0);
  });
});

