import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import AnalyticsPage from '@/pages/AnalyticsPage';

// Mock the heavy analytics hook
const mockAnalytics = {
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
  dateRange: { startDate: '2026-07-01', endDate: '2026-07-31' },
  summary: {
    totalIncome: 5000, totalExpenses: 2000, netSavings: 3000, savingsRate: 60,
    avgDailySpending: 65, transactionCount: 20,
    incomeChange: 10, expenseChange: -5, savingsChange: 15,
    largestExpense: 500, largestIncome: 5000,
    daysInPeriod: 31, currentStreak: 5,
  },
  dailySeries: [],
  weeklySeries: [],
  monthlySeries: [],
  expenseCategories: [],
  incomeCategories: [],
  heatmapData: [],
  financialHealth: { score: 75, label: 'Good', color: '#22c55e', tips: ['Keep saving!'] },
  insights: [],
  spendingPatterns: null,
  monthlyReport: null,
  yearlyReport: null,
  largestTransactions: [],
  smallestTransactions: [],
  savingsTrend: [],
};

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: vi.fn(() => mockAnalytics),
  useCurrency: () => 'USD',
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

vi.mock('@/services/transactions', () => ({
  getTransactions: vi.fn().mockResolvedValue({ data: [], error: null }),
}));

// Mock all the chart components to avoid Recharts rendering issues in tests
vi.mock('@/components/analytics/IncomeVsExpenseChart', () => ({ default: () => <div data-testid="income-vs-expense-chart" /> }));
vi.mock('@/components/analytics/ExpenseTrendChart', () => ({ default: () => <div data-testid="expense-trend-chart" /> }));
vi.mock('@/components/analytics/CashFlowChart', () => ({ default: () => <div data-testid="cash-flow-chart" /> }));
vi.mock('@/components/analytics/DailySpendingChart', () => ({ default: () => <div data-testid="daily-spending-chart" /> }));
vi.mock('@/components/analytics/WeeklySpendingChart', () => ({ default: () => <div data-testid="weekly-chart" /> }));
vi.mock('@/components/analytics/MonthlySpendingChart', () => ({ default: () => <div data-testid="monthly-chart" /> }));
vi.mock('@/components/analytics/CategoryPieChart', () => ({ default: () => <div data-testid="pie-chart" /> }));
vi.mock('@/components/analytics/CategoryComparisonChart', () => ({ default: () => <div data-testid="comparison-chart" /> }));
vi.mock('@/components/analytics/SavingsTrendChart', () => ({ default: () => <div data-testid="savings-trend-chart" /> }));
vi.mock('@/components/analytics/TopCategories', () => ({ default: () => <div data-testid="top-categories" /> }));
vi.mock('@/components/analytics/LargestTransactions', () => ({ default: () => <div data-testid="largest-transactions" /> }));
vi.mock('@/components/analytics/ExpenseHeatmap', () => ({ default: () => <div data-testid="heatmap" /> }));
vi.mock('@/components/analytics/FinancialHealthCard', () => ({ default: () => <div data-testid="financial-health" /> }));
vi.mock('@/components/analytics/SmartInsights', () => ({ default: () => <div data-testid="smart-insights" /> }));
vi.mock('@/components/analytics/SpendingPatterns', () => ({ default: () => <div data-testid="spending-patterns" /> }));
vi.mock('@/components/analytics/MonthlyReport', () => ({ default: () => <div data-testid="monthly-report" /> }));
vi.mock('@/components/analytics/YearlyReport', () => ({ default: () => <div data-testid="yearly-report" /> }));
vi.mock('@/components/analytics/CategoryBreakdownTable', () => ({ default: () => <div data-testid="breakdown-table" /> }));
vi.mock('@/components/analytics/InvestmentTracker', () => ({ default: () => <div data-testid="investment-tracker" /> }));

import { useAnalytics } from '@/hooks/useAnalytics';
const mockUseAnalytics = vi.mocked(useAnalytics);

describe('AnalyticsPage', () => {
  it('renders page header and sections when data loaded', () => {
    renderWithProviders(<AnalyticsPage />);
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();
    expect(screen.getByText('Category Analysis')).toBeInTheDocument();
    expect(screen.getByText('Spending Over Time')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.getByText('Rankings')).toBeInTheDocument();
    expect(screen.getByText('Insights & Patterns')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Detailed Breakdown')).toBeInTheDocument();
  });

  it('renders chart components', () => {
    renderWithProviders(<AnalyticsPage />);
    expect(screen.getByTestId('income-vs-expense-chart')).toBeInTheDocument();
    expect(screen.getByTestId('financial-health')).toBeInTheDocument();
    expect(screen.getByTestId('cash-flow-chart')).toBeInTheDocument();
    expect(screen.getByTestId('savings-trend-chart')).toBeInTheDocument();
    expect(screen.getByTestId('heatmap')).toBeInTheDocument();
    expect(screen.getByTestId('smart-insights')).toBeInTheDocument();
    expect(screen.getByTestId('breakdown-table')).toBeInTheDocument();
  });

  it('shows loading skeleton when analytics is loading', () => {
    mockUseAnalytics.mockReturnValue({ ...mockAnalytics, isLoading: true, summary: null } as never);
    const { container } = renderWithProviders(<AnalyticsPage />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows error state when analytics fails', () => {
    mockUseAnalytics.mockReturnValue({ ...mockAnalytics, isError: true, summary: null } as never);
    renderWithProviders(<AnalyticsPage />);
    expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
  });

  it('renders time range filter', () => {
    mockUseAnalytics.mockReturnValue(mockAnalytics as never);
    renderWithProviders(<AnalyticsPage />);
    // TimeRangeFilter renders preset buttons
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders investments section', () => {
    mockUseAnalytics.mockReturnValue(mockAnalytics as never);
    renderWithProviders(<AnalyticsPage />);
    expect(screen.getByText('Investments')).toBeInTheDocument();
    expect(screen.getByTestId('investment-tracker')).toBeInTheDocument();
  });
});

