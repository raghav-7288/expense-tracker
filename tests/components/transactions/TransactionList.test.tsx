import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import TransactionList from '@/components/transactions/TransactionList';
import { buildTransaction } from '@/test/factories';

const mockMutateUpdate = vi.fn().mockResolvedValue({});
const mockMutateDelete = vi.fn().mockResolvedValue({});

vi.mock('@/hooks/useTransactions', () => ({
  useUpdateTransaction: () => ({ mutateAsync: mockMutateUpdate, isPending: false }),
  useDeleteTransaction: () => ({ mutateAsync: mockMutateDelete, isPending: false }),
}));
vi.mock('@/hooks/useCurrency', () => ({ useCurrency: () => 'USD' }));
vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ data: [], isLoading: false }),
}));

describe('TransactionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list of transactions', () => {
    const transactions = [
      buildTransaction({ id: '1', description: 'Groceries', amount: 50, type: 'expense' }),
      buildTransaction({ id: '2', description: 'Salary', amount: 5000, type: 'income' }),
    ];
    renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('shows formatted amounts with +/- prefix', () => {
    const transactions = [
      buildTransaction({ id: '1', description: 'Inc', amount: 100, type: 'income' }),
      buildTransaction({ id: '2', description: 'Exp', amount: 50, type: 'expense' }),
    ];
    renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.getByText('+$100.00')).toBeInTheDocument();
    expect(screen.getByText('-$50.00')).toBeInTheDocument();
  });

  it('has edit and delete buttons', () => {
    const transactions = [buildTransaction({ id: '1', description: 'Test' })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.getByLabelText('Edit transaction')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete transaction')).toBeInTheDocument();
  });

  it('opens edit modal on edit click', async () => {
    const transactions = [buildTransaction({ id: '1', description: 'Test', amount: 10, type: 'expense', date: '2024-01-01' })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    await userEvent.click(screen.getByLabelText('Edit transaction'));
    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
  });

  it('opens delete confirmation on delete click', async () => {
    const transactions = [buildTransaction({ id: '1', description: 'Test' })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    await userEvent.click(screen.getByLabelText('Delete transaction'));
    expect(screen.getByText('Delete Transaction')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
  });

  it('calls delete mutation and closes modal on confirm', async () => {
    const transactions = [buildTransaction({ id: '1', description: 'Test' })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    await userEvent.click(screen.getByLabelText('Delete transaction'));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(mockMutateDelete).toHaveBeenCalledWith('1');
    });
  });

  it('closes delete modal on cancel', async () => {
    const transactions = [buildTransaction({ id: '1', description: 'Test' })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    await userEvent.click(screen.getByLabelText('Delete transaction'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Delete Transaction')).not.toBeInTheDocument();
  });

  it('shows category name when available', () => {
    const transactions = [buildTransaction({
      id: '1', description: 'Lunch',
      categories: { id: 'c1', user_id: 'u1', name: 'Food', type: 'expense', color: '#ef4444', icon: 'utensils', created_at: '', updated_at: '' },
    })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('displays formatted date', () => {
    const transactions = [buildTransaction({ id: '1', description: 'Test', date: '2024-06-15' })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.getByText('Jun 15, 2024')).toBeInTheDocument();
  });
});

