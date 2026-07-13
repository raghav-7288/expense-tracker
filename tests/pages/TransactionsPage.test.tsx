import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import TransactionsPage from '@/pages/TransactionsPage';

vi.mock('@/hooks/useTransactions', () => ({
  useTransactions: vi.fn(),
  useCreateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => 'USD',
}));

import { useTransactions } from '@/hooks/useTransactions';
const mockUseTransactions = vi.mocked(useTransactions);

describe('TransactionsPage', () => {
  it('shows skeleton when loading', () => {
    mockUseTransactions.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as never);

    const { container } = renderWithProviders(<TransactionsPage />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows error state on error', () => {
    mockUseTransactions.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<TransactionsPage />);
    expect(screen.getByText('Failed to load transactions')).toBeInTheDocument();
  });

  it('shows empty state when no transactions', () => {
    mockUseTransactions.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<TransactionsPage />);
    expect(screen.getByText('Start tracking your money')).toBeInTheDocument();
  });

  it('renders transaction list when data available', () => {
    mockUseTransactions.mockReturnValue({
      data: [
        {
          id: '1', type: 'expense', amount: 50, description: 'Groceries',
          date: '2024-06-15', user_id: 'u1', category_id: null, notes: null,
          created_at: '', updated_at: '', categories: null,
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<TransactionsPage />);
    expect(screen.getAllByText('Groceries').length).toBeGreaterThanOrEqual(1);
  });

  it('opens modal when Add Transaction is clicked', async () => {
    mockUseTransactions.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderWithProviders(<TransactionsPage />);
    // There may be multiple "Add Transaction" buttons (header + empty state)
    const buttons = screen.getAllByRole('button', { name: /Add Transaction/i });
    await userEvent.click(buttons[0]!);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});



