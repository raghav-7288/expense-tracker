import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import RecentTransactions from '@/components/dashboard/RecentTransactions';

vi.mock('@/hooks/useDashboard', () => ({ useRecentTransactions: vi.fn() }));
vi.mock('@/hooks/useCurrency', () => ({ useCurrency: () => 'USD' }));

import { useRecentTransactions } from '@/hooks/useDashboard';
const mockUseRecentTransactions = vi.mocked(useRecentTransactions);

describe('RecentTransactions', () => {
  it('shows skeleton when loading', () => {
    mockUseRecentTransactions.mockReturnValue({ data: undefined, isLoading: true } as never);
    const { container } = renderWithProviders(<RecentTransactions />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows empty message when no transactions', () => {
    mockUseRecentTransactions.mockReturnValue({ data: [], isLoading: false } as never);
    renderWithProviders(<RecentTransactions />);
    expect(screen.getByText(/No activity yet/)).toBeInTheDocument();
  });

  it('renders transactions', () => {
    mockUseRecentTransactions.mockReturnValue({
      data: [{
        id: '1', type: 'expense', amount: 25, description: 'Coffee',
        date: '2024-06-15', user_id: 'u1', category_id: 'c1', notes: null,
        created_at: '', updated_at: '',
        categories: { id: 'c1', name: 'Food', color: '#ef4444', icon: 'coffee', user_id: 'u1', type: 'expense', created_at: '', updated_at: '' },
      }],
      isLoading: false,
    } as never);
    renderWithProviders(<RecentTransactions />);
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('View all')).toBeInTheDocument();
  });
});

