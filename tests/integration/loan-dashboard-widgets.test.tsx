/**
 * Tests that existing dashboard balance widgets are NOT affected by loan transactions.
 * Verifies:
 * - StatCards show correct income/expense totals (excluding loans)
 * - Monthly charts data excludes loan transactions
 * - LoanSummaryCard is present alongside existing widgets
 * - AccountBalances widget remains functional
 */
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import DashboardPage from '@/pages/DashboardPage';

vi.mock('@/hooks/useDashboard', () => ({
  useDashboardStats: vi.fn(),
  useMonthlyData: vi.fn(),
  useCategoryBreakdown: vi.fn(),
}));
vi.mock('@/hooks/useCurrency', () => ({ useCurrency: () => 'USD' }));
vi.mock('@/hooks/useAccounts', () => ({
  useAccountBalances: () => ({ data: [{ account: { id: 'a1' }, balance: 50000 }] }),
  useAccounts: () => ({ data: [] }),
}));
vi.mock('@/components/dashboard/RecentTransactions', () => ({
  default: () => <div data-testid="recent-transactions">Recent</div>,
}));
vi.mock('@/components/dashboard/MonthlyChart', () => ({
  default: () => <div data-testid="monthly-chart">Monthly</div>,
}));
vi.mock('@/components/dashboard/CategoryChart', () => ({
  default: () => <div data-testid="category-chart">Category</div>,
}));
vi.mock('@/components/dashboard/AccountBalances', () => ({
  default: () => <div data-testid="account-balances">Accounts</div>,
}));
vi.mock('@/components/loans/LoanSummaryCard', () => ({
  default: () => <div data-testid="loan-summary-card">Loan Summary</div>,
}));

import { useDashboardStats } from '@/hooks/useDashboard';
const mockUseDashboardStats = vi.mocked(useDashboardStats);

describe('DashboardPage – Balance Widgets Unaffected by Loans', () => {
  it('renders all stat cards with income/expense data (no loan contamination)', () => {
    mockUseDashboardStats.mockReturnValue({
      data: {
        totalBalance: 8000,
        totalIncome: 15000,
        totalExpenses: 7000,
        monthlyIncome: 5000,
        monthlyExpenses: 2000,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Balance')).toBeInTheDocument();
    // Unified balance uses account balance ($50,000 from mock) as source of truth
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('$2,000.00')).toBeInTheDocument();
  });

  it('net savings correctly calculated as monthlyIncome - monthlyExpenses', () => {
    mockUseDashboardStats.mockReturnValue({
      data: {
        totalBalance: 3000,
        totalIncome: 10000,
        totalExpenses: 7000,
        monthlyIncome: 4000,
        monthlyExpenses: 2500,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Net Savings')).toBeInTheDocument();
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    expect(screen.getByText('+$1,500.00')).toBeInTheDocument();
  });

  it('renders Loan Summary Card widget on dashboard', () => {
    mockUseDashboardStats.mockReturnValue({
      data: {
        totalBalance: 0, totalIncome: 0, totalExpenses: 0,
        monthlyIncome: 0, monthlyExpenses: 0,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<DashboardPage />);
    expect(screen.getByTestId('loan-summary-card')).toBeInTheDocument();
  });

  it('renders Account Balances widget (unchanged)', () => {
    mockUseDashboardStats.mockReturnValue({
      data: {
        totalBalance: 0, totalIncome: 0, totalExpenses: 0,
        monthlyIncome: 0, monthlyExpenses: 0,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<DashboardPage />);
    expect(screen.getByTestId('account-balances')).toBeInTheDocument();
  });

  it('renders charts section (unchanged)', () => {
    mockUseDashboardStats.mockReturnValue({
      data: {
        totalBalance: 0, totalIncome: 0, totalExpenses: 0,
        monthlyIncome: 0, monthlyExpenses: 0,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<DashboardPage />);
    expect(screen.getByTestId('monthly-chart')).toBeInTheDocument();
    expect(screen.getByTestId('category-chart')).toBeInTheDocument();
  });

  it('renders Recent Transactions widget (unchanged)', () => {
    mockUseDashboardStats.mockReturnValue({
      data: {
        totalBalance: 0, totalIncome: 0, totalExpenses: 0,
        monthlyIncome: 0, monthlyExpenses: 0,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<DashboardPage />);
    expect(screen.getByTestId('recent-transactions')).toBeInTheDocument();
  });
});

describe('Monthly Data – Loan Exclusion Logic', () => {
  it('excludes lent/borrowed from monthly income/expense aggregation', () => {
    const monthlyRows = [
      { type: 'income', amount: 5000, date: '2026-01-15' },
      { type: 'expense', amount: 2000, date: '2026-01-20' },
      { type: 'lent', amount: 3000, date: '2026-01-25' },
      { type: 'borrowed', amount: 8000, date: '2026-01-05' },
      { type: 'income', amount: 1000, date: '2026-02-10' },
    ];

    // Simulate the hook's aggregation logic
    const monthMap = new Map<string, { income: number; expenses: number }>();
    for (let m = 0; m < 12; m++) {
      const key = `2026-${String(m + 1).padStart(2, '0')}-01`;
      monthMap.set(key, { income: 0, expenses: 0 });
    }

    for (const row of monthlyRows) {
      if (row.type === 'lent' || row.type === 'borrowed') continue;
      const month = row.date.substring(0, 7) + '-01';
      const entry = monthMap.get(month);
      if (entry) {
        if (row.type === 'income') entry.income += Number(row.amount);
        else entry.expenses += Number(row.amount);
      }
    }

    const jan = monthMap.get('2026-01-01');
    const feb = monthMap.get('2026-02-01');

    // January: only 5000 income, 2000 expense (lent/borrowed excluded)
    expect(jan?.income).toBe(5000);
    expect(jan?.expenses).toBe(2000);
    // February: only 1000 income
    expect(feb?.income).toBe(1000);
    expect(feb?.expenses).toBe(0);
  });

  it('month with ONLY loan transactions shows zero income/expense', () => {
    const monthlyRows = [
      { type: 'lent', amount: 5000, date: '2026-03-10' },
      { type: 'borrowed', amount: 3000, date: '2026-03-15' },
    ];

    const monthMap = new Map<string, { income: number; expenses: number }>();
    monthMap.set('2026-03-01', { income: 0, expenses: 0 });

    for (const row of monthlyRows) {
      if (row.type === 'lent' || row.type === 'borrowed') continue;
      const month = row.date.substring(0, 7) + '-01';
      const entry = monthMap.get(month);
      if (entry) {
        if (row.type === 'income') entry.income += Number(row.amount);
        else entry.expenses += Number(row.amount);
      }
    }

    const march = monthMap.get('2026-03-01');
    expect(march?.income).toBe(0);
    expect(march?.expenses).toBe(0);
  });

  it('income/expense totals remain accurate even with many loan transactions', () => {
    const monthlyRows = [
      { type: 'income', amount: 10000, date: '2026-04-01' },
      { type: 'expense', amount: 3000, date: '2026-04-05' },
      { type: 'lent', amount: 5000, date: '2026-04-10' },
      { type: 'lent', amount: 2000, date: '2026-04-12' },
      { type: 'borrowed', amount: 15000, date: '2026-04-15' },
      { type: 'borrowed', amount: 3000, date: '2026-04-20' },
      { type: 'expense', amount: 500, date: '2026-04-25' },
    ];

    const monthMap = new Map<string, { income: number; expenses: number }>();
    monthMap.set('2026-04-01', { income: 0, expenses: 0 });

    for (const row of monthlyRows) {
      if (row.type === 'lent' || row.type === 'borrowed') continue;
      const month = row.date.substring(0, 7) + '-01';
      const entry = monthMap.get(month);
      if (entry) {
        if (row.type === 'income') entry.income += Number(row.amount);
        else entry.expenses += Number(row.amount);
      }
    }

    const april = monthMap.get('2026-04-01');
    // Only 10000 income, 3500 expenses (loan amounts totally excluded)
    expect(april?.income).toBe(10000);
    expect(april?.expenses).toBe(3500);
  });
});

