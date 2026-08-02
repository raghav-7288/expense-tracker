import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import RecurringForm from '@/components/recurring/RecurringForm';

const FOOD = {
  id: 'c1', name: 'Food', type: 'expense', color: '#ef4444', icon: 'utensils',
  user_id: 'u1', created_at: '', updated_at: '',
};

// A mutable categories list so tests can simulate the post-invalidation refresh
// that the auto-select effect depends on.
const { mockCreateCategory, categoriesRef } = vi.hoisted(() => ({
  mockCreateCategory: vi.fn(),
  categoriesRef: { current: [] as Array<Record<string, unknown>> },
}));

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ data: categoriesRef.current, isLoading: false }),
  useCreateCategory: () => ({ mutateAsync: mockCreateCategory, isPending: false }),
}));

describe('RecurringForm', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    categoriesRef.current = [FOOD];
  });

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

  // ── Inline category creation ──────────────────────────────────────────────
  describe('inline category creation', () => {
    function openPanel() {
      return userEvent.click(screen.getByRole('button', { name: /New category/i }));
    }

    it('opens and closes the inline panel via the toggle', async () => {
      renderWithProviders(<RecurringForm onSubmit={onSubmit} onCancel={onCancel} />);
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
      const toggle = screen.getByRole('button', { name: /New category/i });
      await userEvent.click(toggle);
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      await userEvent.click(toggle);
      await waitFor(() => expect(screen.queryByLabelText('Name')).not.toBeInTheDocument());
    });

    it('creates a category of the selected type', async () => {
      mockCreateCategory.mockResolvedValue({ id: 'c-new', name: 'Rent', type: 'expense' });
      renderWithProviders(<RecurringForm onSubmit={onSubmit} onCancel={onCancel} />);
      await openPanel();
      await userEvent.type(screen.getByLabelText('Name'), 'Rent');
      await userEvent.click(screen.getByRole('button', { name: /Create & select/i }));
      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Rent', type: 'expense' }),
        );
      });
    });

    it('sends the chosen name, icon, and color in the create payload', async () => {
      mockCreateCategory.mockResolvedValue({ id: 'c-new' });
      renderWithProviders(<RecurringForm onSubmit={onSubmit} onCancel={onCancel} />);
      await openPanel();
      await userEvent.type(screen.getByLabelText('Name'), 'Rent');
      await userEvent.selectOptions(screen.getByLabelText('Icon'), 'car');
      await userEvent.click(screen.getByLabelText('Select color #f59e0b'));
      await userEvent.click(screen.getByRole('button', { name: /Create & select/i }));
      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith({
          name: 'Rent', type: 'expense', icon: 'car', color: '#f59e0b',
        });
      });
    });

    it('trims surrounding whitespace from the category name', async () => {
      mockCreateCategory.mockResolvedValue({ id: 'c-new' });
      renderWithProviders(<RecurringForm onSubmit={onSubmit} onCancel={onCancel} />);
      await openPanel();
      await userEvent.type(screen.getByLabelText('Name'), '   Coffee   ');
      await userEvent.click(screen.getByRole('button', { name: /Create & select/i }));
      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith(expect.objectContaining({ name: 'Coffee' }));
      });
    });

    it('accepts emoji and special characters in the name', async () => {
      mockCreateCategory.mockResolvedValue({ id: 'c-new' });
      renderWithProviders(<RecurringForm onSubmit={onSubmit} onCancel={onCancel} />);
      await openPanel();
      const fancy = '🍕 Food & Drinks (50%)';
      await userEvent.type(screen.getByLabelText('Name'), fancy);
      await userEvent.click(screen.getByRole('button', { name: /Create & select/i }));
      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith(expect.objectContaining({ name: fancy }));
      });
    });

    it('caps the name at 50 characters (long-name guard)', async () => {
      renderWithProviders(<RecurringForm onSubmit={onSubmit} onCancel={onCancel} />);
      await openPanel();
      expect(screen.getByLabelText('Name')).toHaveAttribute('maxlength', '50');
    });

    it('does not create a category when the name is empty or whitespace', async () => {
      renderWithProviders(<RecurringForm onSubmit={onSubmit} onCancel={onCancel} />);
      await openPanel();
      expect(screen.getByRole('button', { name: /Create & select/i })).toBeDisabled();
      await userEvent.type(screen.getByLabelText('Name'), '    ');
      expect(screen.getByRole('button', { name: /Create & select/i })).toBeDisabled();
      expect(mockCreateCategory).not.toHaveBeenCalled();
    });

    it('creates an INCOME category when the type is income', async () => {
      mockCreateCategory.mockResolvedValue({ id: 'c-new' });
      renderWithProviders(<RecurringForm onSubmit={onSubmit} onCancel={onCancel} />);
      await userEvent.click(screen.getByText('Income'));
      await openPanel();
      await userEvent.type(screen.getByLabelText('Name'), 'Salary');
      await userEvent.click(screen.getByRole('button', { name: /Create & select/i }));
      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Salary', type: 'income' }),
        );
      });
    });

    it('auto-selects the new category once it appears in the refreshed list', async () => {
      categoriesRef.current = [FOOD, { ...FOOD, id: 'c-new', name: 'Rent' }];
      mockCreateCategory.mockResolvedValue({ id: 'c-new' });
      renderWithProviders(<RecurringForm onSubmit={onSubmit} onCancel={onCancel} />);
      const categorySelect = screen.getByLabelText('Category') as HTMLSelectElement;
      expect(categorySelect.value).toBe('');
      await openPanel();
      await userEvent.type(screen.getByLabelText('Name'), 'Rent');
      await userEvent.click(screen.getByRole('button', { name: /Create & select/i }));
      await waitFor(() => expect(categorySelect.value).toBe('c-new'));
    });

    it('keeps the panel open on failure and allows a retry (no unhandled rejection)', async () => {
      mockCreateCategory
        .mockRejectedValueOnce(new Error('network down'))
        .mockResolvedValueOnce({ id: 'c-new' });
      renderWithProviders(<RecurringForm onSubmit={onSubmit} onCancel={onCancel} />);
      await openPanel();
      await userEvent.type(screen.getByLabelText('Name'), 'Rent');

      await userEvent.click(screen.getByRole('button', { name: /Create & select/i }));
      await waitFor(() => expect(mockCreateCategory).toHaveBeenCalledTimes(1));
      expect(screen.getByLabelText('Name')).toHaveValue('Rent');

      await userEvent.click(screen.getByRole('button', { name: /Create & select/i }));
      await waitFor(() => expect(screen.queryByLabelText('Name')).not.toBeInTheDocument());
      expect(mockCreateCategory).toHaveBeenCalledTimes(2);
    });
  });
});

