import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import TransactionList from '@/components/transactions/TransactionList';
import { buildTransaction } from '@/test/factories';

const mockMutateUpdate = vi.fn().mockResolvedValue({});
const mockMutateDelete = vi.fn().mockResolvedValue({});
const mockMutateLoanUpdate = vi.fn().mockResolvedValue({});
const mockMutateLoanDelete = vi.fn().mockResolvedValue({});

vi.mock('@/hooks/useTransactions', () => ({
  useUpdateTransaction: () => ({ mutateAsync: mockMutateUpdate, isPending: false }),
  useDeleteTransaction: () => ({ mutateAsync: mockMutateDelete, isPending: false }),
  useUpdateLoanTransaction: () => ({ mutateAsync: mockMutateLoanUpdate, isPending: false }),
  useDeleteLoanTransaction: () => ({ mutateAsync: mockMutateLoanDelete, isPending: false }),
}));
vi.mock('@/hooks/useCurrency', () => ({ useCurrency: () => 'USD' }));
vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ data: [], isLoading: false }),
  useCreateCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe('TransactionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list of transactions', () => {
    const transactions = [
      buildTransaction({ id: '1', notes: 'Groceries', amount: 50, type: 'expense' }),
      buildTransaction({ id: '2', notes: 'Salary', amount: 5000, type: 'income' }),
    ];
    renderWithProviders(<TransactionList transactions={transactions} />);
    // Rendered in both desktop table and mobile cards
    expect(screen.getAllByText('Groceries').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Salary').length).toBeGreaterThanOrEqual(1);
  });

  it('shows formatted amounts with +/- prefix', () => {
    const transactions = [
      buildTransaction({ id: '1', notes: 'Inc', amount: 100, type: 'income' }),
      buildTransaction({ id: '2', notes: 'Exp', amount: 50, type: 'expense' }),
    ];
    renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.getAllByText('+$100.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('-$50.00').length).toBeGreaterThanOrEqual(1);
  });

  it('has edit and delete buttons', () => {
    const transactions = [buildTransaction({ id: '1', notes: 'Test' })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.getAllByLabelText('Edit transaction').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText('Delete transaction').length).toBeGreaterThanOrEqual(1);
  });

  it('shows loan badge and edit/delete for lent transactions with loan_info', () => {
    const transactions = [buildTransaction({
      id: 'L1',
      notes: 'Lent to Rahul',
      type: 'lent',
      amount: 5000,
      loan_info: { loan_id: 'loan-1', event_type: 'disbursement', loan: null },
    })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    // Loan transactions now have edit/delete buttons
    expect(screen.getAllByLabelText('Edit transaction').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText('Delete transaction').length).toBeGreaterThanOrEqual(1);
    // Shows a loan badge
    expect(screen.getAllByText('Loan').length).toBeGreaterThanOrEqual(1);
  });

  it('shows repay badge and edit/delete for borrowed transactions with loan_info', () => {
    const transactions = [buildTransaction({
      id: 'B1',
      notes: 'Borrowed from Priya',
      type: 'borrowed',
      amount: 10000,
      loan_info: { loan_id: 'loan-2', event_type: 'repayment', loan: null },
    })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.getAllByLabelText('Edit transaction').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText('Delete transaction').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Repay').length).toBeGreaterThanOrEqual(1);
  });

  it('shows edit/delete on all rows in a mixed list (income/expense + loan)', () => {
    const transactions = [
      buildTransaction({ id: '1', notes: 'Groceries', type: 'expense' }),
      buildTransaction({
        id: '2',
        notes: 'Lent to Rahul',
        type: 'lent',
        loan_info: { loan_id: 'loan-1', event_type: 'disbursement', loan: null },
      }),
    ];
    renderWithProviders(<TransactionList transactions={transactions} />);
    // Both rows get edit/delete (desktop + mobile = multiple)
    expect(screen.getAllByLabelText('Edit transaction').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByLabelText('Delete transaction').length).toBeGreaterThanOrEqual(2);
  });

  it('opens edit modal on edit click', async () => {
    const transactions = [buildTransaction({ id: '1', notes: 'Test', amount: 10, type: 'expense', date: '2024-01-01' })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    const editButtons = screen.getAllByLabelText('Edit transaction');
    await userEvent.click(editButtons[0]!);
    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
  });

  it('opens delete confirmation on delete click', async () => {
    const transactions = [buildTransaction({ id: '1', notes: 'Test' })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    const deleteButtons = screen.getAllByLabelText('Delete transaction');
    await userEvent.click(deleteButtons[0]!);
    expect(screen.getByText('Delete Transaction')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
  });

  it('calls delete mutation and closes modal on confirm', async () => {
    const transactions = [buildTransaction({ id: '1', notes: 'Test' })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    const deleteButtons = screen.getAllByLabelText('Delete transaction');
    await userEvent.click(deleteButtons[0]!);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(mockMutateDelete).toHaveBeenCalledWith('1');
    });
  });

  it('calls loan delete mutation for loan repayment transactions', async () => {
    const transactions = [buildTransaction({
      id: 'R1',
      notes: 'Repayment from Rahul',
      type: 'lent',
      loan_info: { loan_id: 'loan-1', event_type: 'repayment', loan: null },
    })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    const deleteButtons = screen.getAllByLabelText('Delete transaction');
    await userEvent.click(deleteButtons[0]!);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(mockMutateLoanDelete).toHaveBeenCalledWith({
        id: 'R1',
        loanId: 'loan-1',
        eventType: 'repayment',
      });
    });
  });

  it('closes delete modal on cancel', async () => {
    const transactions = [buildTransaction({ id: '1', notes: 'Test' })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    const deleteButtons = screen.getAllByLabelText('Delete transaction');
    await userEvent.click(deleteButtons[0]!);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.queryByText('Delete Transaction')).not.toBeInTheDocument();
    });
  });

  it('shows category name when available', () => {
    const transactions = [buildTransaction({
      id: '1', notes: 'Lunch',
      categories: { id: 'c1', user_id: 'u1', name: 'Food', type: 'expense', color: '#ef4444', icon: 'utensils', created_at: '', updated_at: '' },
    })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.getAllByText('Food').length).toBeGreaterThanOrEqual(1);
  });

  it('displays formatted date', () => {
    const transactions = [buildTransaction({ id: '1', notes: 'Test', date: '2024-06-15' })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.getAllByText('Jun 15, 2024').length).toBeGreaterThanOrEqual(1);
  });

  // Regression: the 🔁 badge is driven by transaction.recurring_id. A bug in
  // normalizeTransaction dropped that field, so the badge silently never rendered.
  it('renders the recurring 🔁 badge only for transactions from a recurring rule', () => {
    const transactions = [buildTransaction({ id: 'gen-1', notes: 'Rent', recurring_id: 'rule-1' })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    // Desktop table exposes it via title, mobile via aria-label — at least one of each.
    expect(screen.getAllByTitle('From a recurring schedule').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText('Recurring').length).toBeGreaterThanOrEqual(1);
  });

  it('does not render the recurring 🔁 badge for a one-off transaction', () => {
    const transactions = [buildTransaction({ id: 'oneoff-1', notes: 'Coffee', recurring_id: null })];
    renderWithProviders(<TransactionList transactions={transactions} />);
    expect(screen.queryByTitle('From a recurring schedule')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Recurring')).not.toBeInTheDocument();
  });
});
