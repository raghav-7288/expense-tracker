import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
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

  it('renders the "All Time" filter button', () => {
    mockUseAnalytics.mockReturnValue(mockAnalytics as never);
    renderWithProviders(<AnalyticsPage />);
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('selects "All Time" by default on first visit', () => {
    mockUseAnalytics.mockReturnValue(mockAnalytics as never);
    mockUseAnalytics.mockClear();
    renderWithProviders(<AnalyticsPage />);

    // The All Time preset is the active button…
    expect(screen.getByText('All Time')).toHaveAttribute('aria-pressed', 'true');
    // …and no other preset is active by default.
    expect(screen.getByText('This Month')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('This Year')).toHaveAttribute('aria-pressed', 'false');

    // The whole analytics tree is driven by the allTime filter → all data.
    expect(mockUseAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ preset: 'allTime', type: 'all' }),
    );
  });

  it('switching to another date filter still works and re-computes analytics', () => {
    mockUseAnalytics.mockReturnValue(mockAnalytics as never);
    renderWithProviders(<AnalyticsPage />);

    // Default active = All Time
    expect(screen.getByText('All Time')).toHaveAttribute('aria-pressed', 'true');

    // Switch to This Month
    fireEvent.click(screen.getByText('This Month'));
    expect(screen.getByText('This Month')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('All Time')).toHaveAttribute('aria-pressed', 'false');
    expect(mockUseAnalytics).toHaveBeenLastCalledWith(
      expect.objectContaining({ preset: 'thisMonth' }),
    );

    // Switch to This Year
    fireEvent.click(screen.getByText('This Year'));
    expect(screen.getByText('This Year')).toHaveAttribute('aria-pressed', 'true');
    expect(mockUseAnalytics).toHaveBeenLastCalledWith(
      expect.objectContaining({ preset: 'thisYear' }),
    );
  });

  it('restores the "All Time" default on a fresh visit (no persisted state)', () => {
    mockUseAnalytics.mockReturnValue(mockAnalytics as never);

    // First visit: change the filter away from the default
    const first = renderWithProviders(<AnalyticsPage />);
    fireEvent.click(screen.getByText('This Month'));
    expect(screen.getByText('This Month')).toHaveAttribute('aria-pressed', 'true');

    // Leave the page
    first.unmount();

    // Return to the page: default is restored to All Time
    renderWithProviders(<AnalyticsPage />);
    expect(screen.getByText('All Time')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('This Month')).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps All Time active alongside the Category and Account filters', () => {
    mockUseAnalytics.mockReturnValue(mockAnalytics as never);
    mockUseAnalytics.mockClear();
    renderWithProviders(<AnalyticsPage />);

    // Account filter present, All Time remains the active date preset
    expect(screen.getByText('All Time')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('combobox')).toBeInTheDocument(); // account <select>

    // Analytics is invoked with the default all-data preset and no category/account restriction
    const firstCallArg = mockUseAnalytics.mock.calls[0]?.[0] as { preset: string; categoryIds?: unknown; accountId?: unknown };
    expect(firstCallArg.preset).toBe('allTime');
    expect(firstCallArg.categoryIds).toBeUndefined();
    expect(firstCallArg.accountId).toBeUndefined();
  });

  it('clears a previously selected custom range when switching to All Time', () => {
    mockUseAnalytics.mockReturnValue(mockAnalytics as never);
    renderWithProviders(<AnalyticsPage />);

    // Select Custom → custom date inputs appear
    fireEvent.click(screen.getByText('Custom'));
    expect(screen.getByLabelText('Start date')).toBeInTheDocument();

    // Switch to All Time → custom inputs disappear (range cleared)
    fireEvent.click(screen.getByText('All Time'));
    expect(screen.queryByLabelText('Start date')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('End date')).not.toBeInTheDocument();

    // The All Time button is now the active preset
    expect(screen.getByText('All Time')).toHaveAttribute('aria-pressed', 'true');
  });
});

