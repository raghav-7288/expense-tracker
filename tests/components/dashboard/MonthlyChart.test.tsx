import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import MonthlyChart from '@/components/dashboard/MonthlyChart';

vi.mock('@/hooks/useDashboard', () => ({ useMonthlyData: vi.fn() }));
vi.mock('@/hooks/useCurrency', () => ({ useCurrency: () => 'USD' }));
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  CartesianGrid: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Legend: () => <div />,
}));

import { useMonthlyData } from '@/hooks/useDashboard';
const mockUseMonthlyData = vi.mocked(useMonthlyData);

describe('MonthlyChart', () => {
  it('shows skeleton when loading', () => {
    mockUseMonthlyData.mockReturnValue({ data: undefined, isLoading: true } as never);
    const { container } = renderWithProviders(<MonthlyChart />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows empty message when all zero', () => {
    mockUseMonthlyData.mockReturnValue({
      data: [{ month: 'Jan', income: 0, expenses: 0 }],
      isLoading: false,
    } as never);
    renderWithProviders(<MonthlyChart />);
    expect(screen.getByText('No data yet')).toBeInTheDocument();
  });

  it('renders chart with data', () => {
    mockUseMonthlyData.mockReturnValue({
      data: [{ month: 'Jan', income: 1000, expenses: 500 }],
      isLoading: false,
    } as never);
    renderWithProviders(<MonthlyChart />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});

