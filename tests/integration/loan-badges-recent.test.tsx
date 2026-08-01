/**
 * Tests that loan badges and correct colors/prefixes appear in RecentTransactions.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { buildTransaction } from '@/test/factories';
import RecentTransactions from '@/components/dashboard/RecentTransactions';

vi.mock('@/hooks/useDashboard', () => ({ useRecentTransactions: vi.fn() }));
vi.mock('@/hooks/useCurrency', () => ({ useCurrency: () => 'USD' }));

import { useRecentTransactions } from '@/hooks/useDashboard';
const mockUseRecentTransactions = vi.mocked(useRecentTransactions);

describe('RecentTransactions – Loan Badges', () => {
  it('displays "Lent" badge for lent transactions', () => {
    mockUseRecentTransactions.mockReturnValue({
      data: [
        buildTransaction({
          id: 'txn-lent-1',
          type: 'lent',
          amount: 5000,
          notes: 'Lent to Rahul',
          categories: null,
        }),
      ],
      isLoading: false,
    } as never);

    renderWithProviders(<RecentTransactions />);
    expect(screen.getByText('Lent to Rahul')).toBeInTheDocument();
    expect(screen.getByText('Lent')).toBeInTheDocument();
    expect(screen.getByText('↗$5,000.00')).toBeInTheDocument();
  });

  it('displays "Borrowed" badge for borrowed transactions', () => {
    mockUseRecentTransactions.mockReturnValue({
      data: [
        buildTransaction({
          id: 'txn-borrow-1',
          type: 'borrowed',
          amount: 10000,
          notes: 'Borrowed from Priya',
          categories: null,
        }),
      ],
      isLoading: false,
    } as never);

    renderWithProviders(<RecentTransactions />);
    expect(screen.getByText('Borrowed from Priya')).toBeInTheDocument();
    expect(screen.getByText('Borrowed')).toBeInTheDocument();
    expect(screen.getByText('↙$10,000.00')).toBeInTheDocument();
  });

  it('does NOT show badge for regular income/expense transactions', () => {
    mockUseRecentTransactions.mockReturnValue({
      data: [
        buildTransaction({ id: 'txn-inc', type: 'income', amount: 3000, notes: 'Salary' }),
        buildTransaction({ id: 'txn-exp', type: 'expense', amount: 500, notes: 'Groceries' }),
      ],
      isLoading: false,
    } as never);

    renderWithProviders(<RecentTransactions />);
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.queryByText('Lent')).not.toBeInTheDocument();
    expect(screen.queryByText('Borrowed')).not.toBeInTheDocument();
  });

  it('shows mixed loan and regular transactions with badges only on loans', () => {
    mockUseRecentTransactions.mockReturnValue({
      data: [
        buildTransaction({ id: '1', type: 'expense', amount: 200, notes: 'Coffee' }),
        buildTransaction({ id: '2', type: 'lent', amount: 1000, notes: 'Lent to Amit', categories: null }),
        buildTransaction({ id: '3', type: 'income', amount: 5000, notes: 'Freelance' }),
        buildTransaction({ id: '4', type: 'borrowed', amount: 3000, notes: 'From Suresh', categories: null }),
      ],
      isLoading: false,
    } as never);

    renderWithProviders(<RecentTransactions />);
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Lent to Amit')).toBeInTheDocument();
    expect(screen.getByText('Freelance')).toBeInTheDocument();
    expect(screen.getByText('From Suresh')).toBeInTheDocument();
    expect(screen.getByText('Lent')).toBeInTheDocument();
    expect(screen.getByText('Borrowed')).toBeInTheDocument();
  });

  it('uses blue color for lent amounts and amber for borrowed amounts', () => {
    mockUseRecentTransactions.mockReturnValue({
      data: [
        buildTransaction({ id: '1', type: 'lent', amount: 500, notes: 'L1', categories: null }),
        buildTransaction({ id: '2', type: 'borrowed', amount: 300, notes: 'B1', categories: null }),
      ],
      isLoading: false,
    } as never);

    const { container } = renderWithProviders(<RecentTransactions />);
    expect(container.querySelector('.text-blue-600')).toBeInTheDocument();
    expect(container.querySelector('.text-amber-600')).toBeInTheDocument();
  });

  it('uses green for income and red for expense (unchanged)', () => {
    mockUseRecentTransactions.mockReturnValue({
      data: [
        buildTransaction({ id: '1', type: 'income', amount: 1000, notes: 'Inc' }),
        buildTransaction({ id: '2', type: 'expense', amount: 200, notes: 'Exp' }),
      ],
      isLoading: false,
    } as never);

    const { container } = renderWithProviders(<RecentTransactions />);
    expect(container.querySelector('.text-emerald-600')).toBeInTheDocument();
    expect(container.querySelector('.text-red-600')).toBeInTheDocument();
  });

  it('shows + prefix for income, - for expense, ↗ for lent, ↙ for borrowed', () => {
    mockUseRecentTransactions.mockReturnValue({
      data: [
        buildTransaction({ id: '1', type: 'income', amount: 100, notes: 'A' }),
        buildTransaction({ id: '2', type: 'expense', amount: 50, notes: 'B' }),
        buildTransaction({ id: '3', type: 'lent', amount: 200, notes: 'C', categories: null }),
        buildTransaction({ id: '4', type: 'borrowed', amount: 75, notes: 'D', categories: null }),
      ],
      isLoading: false,
    } as never);

    renderWithProviders(<RecentTransactions />);
    expect(screen.getByText('+$100.00')).toBeInTheDocument();
    expect(screen.getByText('-$50.00')).toBeInTheDocument();
    expect(screen.getByText('↗$200.00')).toBeInTheDocument();
    expect(screen.getByText('↙$75.00')).toBeInTheDocument();
  });
});

