import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import TransactionFilterBar from '@/components/transactions/TransactionFilters';
import type { TransactionFilters } from '@/types';

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    data: [{ id: 'c1', name: 'Food', type: 'expense', color: '#ef4444', icon: 'utensils', user_id: 'u1', created_at: '', updated_at: '' }],
    isLoading: false,
  }),
}));

describe('TransactionFilterBar', () => {
  const defaultFilters: TransactionFilters = { sort_by: 'date', sort_order: 'desc' };

  it('renders all filter controls', () => {
    renderWithProviders(<TransactionFilterBar filters={defaultFilters} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search transactions...')).toBeInTheDocument();
    expect(screen.getByText('All Types')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('calls onChange when search input changes', async () => {
    const onChange = vi.fn();
    renderWithProviders(<TransactionFilterBar filters={defaultFilters} onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText('Search transactions...'), 'g');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'g' }));
  });

  it('calls onChange when type filter changes', async () => {
    const onChange = vi.fn();
    renderWithProviders(<TransactionFilterBar filters={defaultFilters} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByDisplayValue('All Types'), 'income');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'income' }));
  });

  it('calls onChange when sort changes', async () => {
    const onChange = vi.fn();
    renderWithProviders(<TransactionFilterBar filters={defaultFilters} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByDisplayValue('Newest First'), 'amount-desc');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sort_by: 'amount', sort_order: 'desc' }));
  });
});

