/**
 * Tests that loan transactions display correctly in the TransactionList
 * and that the Badge component handles all 4 transaction types.
 * Also verifies existing income/expense display is unchanged.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { buildTransaction } from '@/test/factories';
import TransactionList from '@/components/transactions/TransactionList';
import Badge from '@/components/ui/Badge';

vi.mock('@/hooks/useTransactions', () => ({
  useUpdateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@/hooks/useCurrency', () => ({ useCurrency: () => 'USD' }));
vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ data: [], isLoading: false }),
}));

describe('TransactionList – Loan Type Display', () => {
  it('shows lent transactions with ↗ prefix and blue color', () => {
    const transactions = [
      buildTransaction({ id: 'lent-1', type: 'lent', amount: 2500, notes: 'Lent to Rahul', categories: null }),
    ];

    const { container } = renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.getAllByText('Lent to Rahul').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('↗$2,500.00').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector('.text-blue-600')).toBeInTheDocument();
  });

  it('shows borrowed transactions with ↙ prefix and amber color', () => {
    const transactions = [
      buildTransaction({ id: 'borrow-1', type: 'borrowed', amount: 8000, notes: 'From Priya', categories: null }),
    ];

    const { container } = renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.getAllByText('From Priya').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('↙$8,000.00').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector('.text-amber-600')).toBeInTheDocument();
  });

  it('still shows income with + prefix and green color (unchanged)', () => {
    const transactions = [
      buildTransaction({ id: 'inc-1', type: 'income', amount: 5000, notes: 'Salary' }),
    ];

    const { container } = renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.getAllByText('+$5,000.00').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector('.text-emerald-600')).toBeInTheDocument();
  });

  it('still shows expense with - prefix and red color (unchanged)', () => {
    const transactions = [
      buildTransaction({ id: 'exp-1', type: 'expense', amount: 200, notes: 'Groceries' }),
    ];

    const { container } = renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.getAllByText('-$200.00').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector('.text-red-600')).toBeInTheDocument();
  });

  it('renders all 4 types in mixed list without errors', () => {
    const transactions = [
      buildTransaction({ id: '1', type: 'income', amount: 5000, notes: 'Salary' }),
      buildTransaction({ id: '2', type: 'expense', amount: 100, notes: 'Coffee' }),
      buildTransaction({ id: '3', type: 'lent', amount: 3000, notes: 'To Amit', categories: null }),
      buildTransaction({ id: '4', type: 'borrowed', amount: 2000, notes: 'From Vikram', categories: null }),
    ];

    renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.getAllByText('Salary').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Coffee').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('To Amit').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('From Vikram').length).toBeGreaterThanOrEqual(1);
  });

  it('shows correct Badge type labels in the table', () => {
    const transactions = [
      buildTransaction({ id: '1', type: 'lent', amount: 100, notes: 'Lent money', categories: null }),
      buildTransaction({ id: '2', type: 'borrowed', amount: 200, notes: 'Borrowed money', categories: null }),
    ];

    renderWithProviders(<TransactionList transactions={transactions} />);
    // Badge component renders labels with CSS uppercase (text content stays capitalized)
    const badges = screen.getAllByText('Lent');
    expect(badges.length).toBeGreaterThanOrEqual(1);
    const borrowedBadges = screen.getAllByText('Borrowed');
    expect(borrowedBadges.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Badge – All Transaction Types', () => {
  it('renders Income badge with green styling', () => {
    const { container } = renderWithProviders(<Badge type="income" />);
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(container.querySelector('.bg-green-50')).toBeInTheDocument();
    expect(container.querySelector('.text-green-700')).toBeInTheDocument();
  });

  it('renders Expense badge with red styling', () => {
    const { container } = renderWithProviders(<Badge type="expense" />);
    expect(screen.getByText('Expense')).toBeInTheDocument();
    expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
    expect(container.querySelector('.text-red-700')).toBeInTheDocument();
  });

  it('renders Lent badge with blue styling', () => {
    const { container } = renderWithProviders(<Badge type="lent" />);
    expect(screen.getByText('Lent')).toBeInTheDocument();
    expect(container.querySelector('.bg-blue-50')).toBeInTheDocument();
    expect(container.querySelector('.text-blue-700')).toBeInTheDocument();
  });

  it('renders Borrowed badge with amber styling', () => {
    const { container } = renderWithProviders(<Badge type="borrowed" />);
    expect(screen.getByText('Borrowed')).toBeInTheDocument();
    expect(container.querySelector('.bg-amber-50')).toBeInTheDocument();
    expect(container.querySelector('.text-amber-700')).toBeInTheDocument();
  });
});


