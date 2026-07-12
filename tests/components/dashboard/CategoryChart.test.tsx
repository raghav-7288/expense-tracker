import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import CategoryChart from '@/components/dashboard/CategoryChart';

vi.mock('@/hooks/useDashboard', () => ({
  useCategoryBreakdown: vi.fn(),
}));
vi.mock('@/hooks/useCurrency', () => ({ useCurrency: () => 'USD' }));
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => <div />,
}));

import { useCategoryBreakdown } from '@/hooks/useDashboard';
const mockUseCategoryBreakdown = vi.mocked(useCategoryBreakdown);

describe('CategoryChart', () => {
  it('shows spinner when loading', () => {
    mockUseCategoryBreakdown.mockReturnValue({ data: undefined, isLoading: true } as never);
    const { container } = renderWithProviders(<CategoryChart />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    mockUseCategoryBreakdown.mockReturnValue({ data: [], isLoading: false } as never);
    renderWithProviders(<CategoryChart />);
    expect(screen.getByText('No expense data this month')).toBeInTheDocument();
  });

  it('renders chart with data', () => {
    mockUseCategoryBreakdown.mockReturnValue({
      data: [
        { name: 'Food', amount: 200, color: '#ef4444', percentage: 60 },
        { name: 'Transport', amount: 100, color: '#3b82f6', percentage: 40 },
      ],
      isLoading: false,
    } as never);
    renderWithProviders(<CategoryChart />);
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });
});

