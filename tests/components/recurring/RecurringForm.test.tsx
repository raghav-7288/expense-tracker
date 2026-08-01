import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import RecurringForm from '@/components/recurring/RecurringForm';

const { mockCreateCategory } = vi.hoisted(() => ({ mockCreateCategory: vi.fn() }));

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    data: [
      { id: 'c1', name: 'Food', type: 'expense', color: '#ef4444', icon: 'utensils', user_id: 'u1', created_at: '', updated_at: '' },
    ],
    isLoading: false,
  }),
  useCreateCategory: () => ({ mutateAsync: mockCreateCategory, isPending: false }),
}));

describe('RecurringForm', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();

  beforeEach(() => { vi.clearAllMocks(); });

  it('renders form fields', () => {
    renderWithProviders(<RecurringForm onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText('Expense')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    expect(screen.getByLabelText('Frequency')).toBeInTheDocument();
    expect(screen.getByLabelText('Start date')).toBeInTheDocument();
  });

  it('calls onCancel when cancel clicked', async () => {
    renderWithProviders(<RecurringForm onSubmit={onSubmit} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('reveals the inline "new category" panel and creates a category of the selected type', async () => {
    mockCreateCategory.mockResolvedValue({ id: 'c-new', name: 'Rent', type: 'expense' });
    renderWithProviders(<RecurringForm onSubmit={onSubmit} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: /New category/i }));
    await userEvent.type(screen.getByLabelText('Name'), 'Rent');
    await userEvent.click(screen.getByRole('button', { name: /Create & select/i }));

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Rent', type: 'expense' }),
      );
    });
  });

  it('does not create a category when the name is empty', async () => {
    renderWithProviders(<RecurringForm onSubmit={onSubmit} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: /New category/i }));
    // Create button is disabled until a name is entered.
    expect(screen.getByRole('button', { name: /Create & select/i })).toBeDisabled();
    expect(mockCreateCategory).not.toHaveBeenCalled();
  });
});

