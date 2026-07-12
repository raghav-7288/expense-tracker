import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import DashboardPage from '@/pages/DashboardPage';

vi.mock('@/hooks/useDashboard', () => ({
  useDashboardStats: vi.fn(),
}));

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => 'USD',
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

import { useDashboardStats } from '@/hooks/useDashboard';
const mockUseDashboardStats = vi.mocked(useDashboardStats);

describe('DashboardPage', () => {
  it('shows skeleton when loading', () => {
    mockUseDashboardStats.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as never);

    const { container } = renderWithProviders(<DashboardPage />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows error state on error', () => {
    mockUseDashboardStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
  });

  it('renders stat cards with formatted data', () => {
    mockUseDashboardStats.mockReturnValue({
      data: {
        totalBalance: 5000,
        totalIncome: 10000,
        totalExpenses: 5000,
        monthlyIncome: 3000,
        monthlyExpenses: 1200,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Total Balance')).toBeInTheDocument();
    expect(screen.getByText('Monthly Income')).toBeInTheDocument();
    expect(screen.getByText('Monthly Expenses')).toBeInTheDocument();
    expect(screen.getByText('Monthly Net')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
    expect(screen.getByText('$1,200.00')).toBeInTheDocument();
    expect(screen.getByText('$1,800.00')).toBeInTheDocument(); // Net = 3000 - 1200
  });

  it('renders charts and recent transactions', () => {
    mockUseDashboardStats.mockReturnValue({
      data: { totalBalance: 0, totalIncome: 0, totalExpenses: 0, monthlyIncome: 0, monthlyExpenses: 0 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<DashboardPage />);
    expect(screen.getByTestId('monthly-chart')).toBeInTheDocument();
    expect(screen.getByTestId('category-chart')).toBeInTheDocument();
    expect(screen.getByTestId('recent-transactions')).toBeInTheDocument();
  });
});


