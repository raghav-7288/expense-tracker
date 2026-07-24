import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import TransactionForm from '@/components/transactions/TransactionForm';

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    data: [
      { id: 'c1', name: 'Food', type: 'expense', color: '#ef4444', icon: 'utensils', user_id: 'u1', created_at: '', updated_at: '' },
    ],
    isLoading: false,
  }),
}));

describe('TransactionForm', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();

  beforeEach(() => { vi.clearAllMocks(); });

  it('renders form fields', () => {
    renderWithProviders(<TransactionForm onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText('Expense')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
  });

  it('shows validation errors for empty submission', async () => {
    renderWithProviders(<TransactionForm onSubmit={onSubmit} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: /Add Transaction/i }));
    await waitFor(() => {
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel clicked', async () => {
    renderWithProviders(<TransactionForm onSubmit={onSubmit} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows Update text when editing', () => {
    const initialData = {
      id: '1', type: 'expense' as const, amount: 50, notes: 'Test',
      date: '2024-06-01', user_id: 'u1', category_id: 'c1',
      created_at: '', updated_at: '', categories: null,
    };
    renderWithProviders(<TransactionForm initialData={initialData} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });

  it('disables submit button when loading', () => {
    renderWithProviders(<TransactionForm onSubmit={onSubmit} onCancel={onCancel} loading={true} />);
    expect(screen.getByRole('button', { name: /Add Transaction/i })).toBeDisabled();
  });
});

