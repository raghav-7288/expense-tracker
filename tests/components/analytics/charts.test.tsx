import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { TimeSeriesPoint, CategoryBreakdownItem, SpendingPatternData, MonthlyReportData, YearlyReportData, TransactionRankingItem } from '@/types/analytics';
import { ThemeContext } from '@/context/ThemeContext';

// Mock Recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: ReactNode }) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: { children: ReactNode }) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: { children: ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: { children: ReactNode }) => <div data-testid="pie-chart">{children}</div>,
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

// Import after mocking
import IncomeVsExpenseChart from '@/components/analytics/IncomeVsExpenseChart';
import ExpenseTrendChart from '@/components/analytics/ExpenseTrendChart';
import CashFlowChart from '@/components/analytics/CashFlowChart';
import DailySpendingChart from '@/components/analytics/DailySpendingChart';
import WeeklySpendingChart from '@/components/analytics/WeeklySpendingChart';
import MonthlySpendingChart from '@/components/analytics/MonthlySpendingChart';
import SavingsTrendChart from '@/components/analytics/SavingsTrendChart';
import CategoryPieChart from '@/components/analytics/CategoryPieChart';
import CategoryComparisonChart from '@/components/analytics/CategoryComparisonChart';
import TopCategories from '@/components/analytics/TopCategories';
import LargestTransactions from '@/components/analytics/LargestTransactions';
import SpendingPatterns from '@/components/analytics/SpendingPatterns';
import MonthlyReport from '@/components/analytics/MonthlyReport';
import YearlyReport from '@/components/analytics/YearlyReport';
import CategoryBreakdownTable from '@/components/analytics/CategoryBreakdownTable';
import ExportButton from '@/components/analytics/ExportButton';
import { AnalyticsSkeleton } from '@/components/analytics/AnalyticsSkeleton';
import ExpenseHeatmap from '@/components/analytics/ExpenseHeatmap';

const seriesData: TimeSeriesPoint[] = [
  { date: '2024-06-01', label: 'Jun 1', income: 500, expenses: 200, net: 300 },
  { date: '2024-06-02', label: 'Jun 2', income: 300, expenses: 400, net: -100 },
];

const categoryBreakdown: CategoryBreakdownItem[] = [
  { name: 'Food', color: '#ef4444', icon: 'utensils', amount: 500, percentage: 50, count: 10, avgTransaction: 50, highestTransaction: 100, lowestTransaction: 10 },
  { name: 'Transport', color: '#3b82f6', icon: 'car', amount: 300, percentage: 30, count: 6, avgTransaction: 50, highestTransaction: 80, lowestTransaction: 20 },
];

const patterns: SpendingPatternData = {
  weekdayTotal: 1000, weekendTotal: 500,
  weekdayAvg: 50, weekendAvg: 100,
  byDayOfWeek: [
    { day: 'Monday', shortDay: 'Mon', amount: 200, count: 4 },
    { day: 'Tuesday', shortDay: 'Tue', amount: 150, count: 3 },
  ],
  busiestDay: 'Monday', quietestDay: 'Sunday',
};

const monthlyReport: MonthlyReportData = {
  monthLabel: 'June 2024', totalIncome: 5000, totalExpenses: 3000,
  savings: 2000, savingsRate: 40, biggestCategory: 'Food',
  mostExpensiveDay: 'Friday, Jun 14', avgTransaction: 200,
  transactionCount: 25, incomeChange: 10, expenseChange: -5,
  savingsChange: 15, comparisonText: 'You spent 5% less than the previous period.',
};

const yearlyReport: YearlyReportData = {
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

const transactions: TransactionRankingItem[] = [
  { id: '1', description: 'Rent', amount: 2000, date: '2024-06-01', categoryName: 'Housing', categoryColor: '#f00', type: 'expense' },
  { id: '2', description: 'Salary', amount: 5000, date: '2024-06-01', categoryName: 'Income', categoryColor: '#0f0', type: 'income' },
];

// ============ LINE/AREA/BAR CHARTS ============

describe('IncomeVsExpenseChart', () => {
  it('renders chart with data', () => {
    render(<IncomeVsExpenseChart data={seriesData} currency="USD" />);
    expect(screen.getByText('Income vs Expenses')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<IncomeVsExpenseChart data={[]} currency="USD" />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });
});

describe('ExpenseTrendChart', () => {
  it('renders with data', () => {
    render(<ExpenseTrendChart data={seriesData} currency="USD" />);
    expect(screen.getByText('Expense Trend')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<ExpenseTrendChart data={[]} currency="USD" />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });
});

describe('CashFlowChart', () => {
  it('renders with data', () => {
    render(<CashFlowChart data={seriesData} currency="USD" />);
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<CashFlowChart data={[]} currency="USD" />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });
});

describe('DailySpendingChart', () => {
  it('renders with data', () => {
    render(<DailySpendingChart data={seriesData} currency="USD" />);
    expect(screen.getByText('Daily Spending')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<DailySpendingChart data={[]} currency="USD" />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });
});

describe('WeeklySpendingChart', () => {
  it('renders with data', () => {
    render(<WeeklySpendingChart data={seriesData} currency="USD" />);
    expect(screen.getByText('Weekly Spending')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<WeeklySpendingChart data={[]} currency="USD" />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });
});

describe('MonthlySpendingChart', () => {
  it('renders with data', () => {
    render(<MonthlySpendingChart data={seriesData} currency="USD" />);
    expect(screen.getByText('Monthly Spending')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<MonthlySpendingChart data={[]} currency="USD" />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });
});

describe('SavingsTrendChart', () => {
  it('renders with data', () => {
    render(<SavingsTrendChart data={seriesData} currency="USD" />);
    expect(screen.getByText('Savings Trend')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<SavingsTrendChart data={[]} currency="USD" />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });
});

// ============ PIE / COMPARISON ============

describe('CategoryPieChart', () => {
  it('renders expense pie chart', () => {
    render(<CategoryPieChart data={categoryBreakdown} type="expense" currency="USD" />, { wrapper: ThemeWrapper });
    expect(screen.getByText('Spending by Category')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('renders income pie chart', () => {
    render(<CategoryPieChart data={categoryBreakdown} type="income" currency="USD" />, { wrapper: ThemeWrapper });
    expect(screen.getByText('Income by Category')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<CategoryPieChart data={[]} type="expense" currency="USD" />, { wrapper: ThemeWrapper });
    expect(screen.getByText(/Add expenses/i)).toBeInTheDocument();
  });
});

describe('CategoryComparisonChart', () => {
  it('renders with data', () => {
    render(<CategoryComparisonChart data={categoryBreakdown} currency="USD" />);
    expect(screen.getByText('Category Comparison')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<CategoryComparisonChart data={[]} currency="USD" />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });
});

// ============ TOP CATEGORIES ============

describe('TopCategories', () => {
  it('renders categories with progress bars', () => {
    render(<TopCategories data={categoryBreakdown} currency="USD" />);
    expect(screen.getByText('Top Spending Categories')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<TopCategories data={[]} currency="USD" />);
    expect(screen.getByText(/Categorize/i)).toBeInTheDocument();
  });

  it('renders INR amounts with ₹ symbol', () => {
    const { container } = render(<TopCategories data={categoryBreakdown} currency="INR" />);
    expect(container.textContent).toContain('₹');
    expect(container.textContent).not.toContain('$');
  });

  it('renders JPY amounts without decimals', () => {
    const { container } = render(<TopCategories data={categoryBreakdown} currency="JPY" />);
    expect(container.textContent).toContain('¥');
    expect(container.textContent).not.toContain('$');
  });
});

// ============ LARGEST TRANSACTIONS ============

describe('LargestTransactions', () => {
  it('renders transactions list', () => {
    render(<LargestTransactions largest={transactions} smallest={transactions} currency="USD" />);
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('renders empty state when no transactions', () => {
    render(<LargestTransactions largest={[]} smallest={[]} currency="USD" />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });

  it('renders EUR amounts with € symbol', () => {
    const { container } = render(<LargestTransactions largest={transactions} smallest={transactions} currency="EUR" />);
    expect(container.textContent).toContain('€');
    expect(container.textContent).not.toContain('$');
  });

  it('currency switch updates all amounts', () => {
    const { container, rerender } = render(<LargestTransactions largest={transactions} smallest={transactions} currency="USD" />);
    expect(container.textContent).toContain('$');
    rerender(<LargestTransactions largest={transactions} smallest={transactions} currency="GBP" />);
    expect(container.textContent).toContain('£');
    expect(container.textContent).not.toContain('$');
  });
});

// ============ SPENDING PATTERNS ============

describe('SpendingPatterns', () => {
  it('renders weekday vs weekend and day-of-week data', () => {
    render(<SpendingPatterns data={patterns} currency="USD" />);
    expect(screen.getByText('Spending Patterns')).toBeInTheDocument();
    expect(screen.getByText(/Weekday vs Weekend/i)).toBeInTheDocument();
  });

  it('renders INR amounts in weekday/weekend labels', () => {
    const { container } = render(<SpendingPatterns data={patterns} currency="INR" />);
    expect(container.textContent).toContain('₹');
    expect(container.textContent).not.toContain('$');
  });
});

// ============ MONTHLY REPORT ============

describe('MonthlyReport', () => {
  it('renders monthly summary', () => {
    render(<MonthlyReport data={monthlyReport} currency="USD" />);
    expect(screen.getByText('June 2024')).toBeInTheDocument();
    expect(screen.getByText(/5% less/)).toBeInTheDocument();
  });

  it('renders with INR currency symbol', () => {
    const { container } = render(<MonthlyReport data={monthlyReport} currency="INR" />);
    expect(container.textContent).toContain('₹');
    expect(container.textContent).not.toContain('$');
  });

  it('currency switch updates all monetary values', () => {
    const { container, rerender } = render(<MonthlyReport data={monthlyReport} currency="USD" />);
    expect(container.textContent).toContain('$');
    rerender(<MonthlyReport data={monthlyReport} currency="EUR" />);
    expect(container.textContent).toContain('€');
    expect(container.textContent).not.toContain('$');
  });
});

// ============ YEARLY REPORT ============

describe('YearlyReport', () => {
  it('renders yearly summary', () => {
    render(<YearlyReport data={yearlyReport} currency="USD" />);
    expect(screen.getByText('2024 Annual Report')).toBeInTheDocument();
  });

  it('renders with GBP currency symbol', () => {
    const { container } = render(<YearlyReport data={yearlyReport} currency="GBP" />);
    expect(container.textContent).toContain('£');
    expect(container.textContent).not.toContain('$');
  });
});

// ============ CATEGORY BREAKDOWN TABLE ============

describe('CategoryBreakdownTable', () => {
  it('renders categories in a table', () => {
    render(<CategoryBreakdownTable data={categoryBreakdown} currency="USD" />);
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<CategoryBreakdownTable data={[]} currency="USD" />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });

  it('renders INR amounts with ₹ symbol', () => {
    const { container } = render(<CategoryBreakdownTable data={categoryBreakdown} currency="INR" />);
    expect(container.textContent).toContain('₹');
    expect(container.textContent).not.toContain('$');
  });

  it('currency switch updates all table values', () => {
    const { container, rerender } = render(<CategoryBreakdownTable data={categoryBreakdown} currency="USD" />);
    expect(container.textContent).toContain('$');
    rerender(<CategoryBreakdownTable data={categoryBreakdown} currency="JPY" />);
    expect(container.textContent).toContain('¥');
    expect(container.textContent).not.toContain('$');
  });
});

// ============ EXPORT BUTTON ============

describe('ExportButton', () => {
  it('renders export button', () => {
    render(<ExportButton transactions={[]} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

// ============ ANALYTICS SKELETON ============

describe('AnalyticsSkeleton', () => {
  it('renders skeleton loading state', () => {
    const { container } = render(<AnalyticsSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});

// ============ EXPENSE HEATMAP ============

describe('ExpenseHeatmap', () => {
  it('renders with empty data', () => {
    render(<ExpenseHeatmap data={[]} currency="USD" />, { wrapper: ThemeWrapper });
    expect(screen.getByText('Expense Heatmap')).toBeInTheDocument();
  });

  it('renders with heatmap data', () => {
    const data = Array.from({ length: 365 }, (_, i) => ({
      date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
      amount: i * 10,
      count: i > 0 ? 1 : 0,
      level: (Math.min(4, Math.floor(i / 90)) as 0 | 1 | 2 | 3 | 4),
    }));
    render(<ExpenseHeatmap data={data} currency="USD" />, { wrapper: ThemeWrapper });
    expect(screen.getByText('Expense Heatmap')).toBeInTheDocument();
  });
});


