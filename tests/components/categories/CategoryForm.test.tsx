import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import CategoryForm from '@/components/categories/CategoryForm';

describe('CategoryForm', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();

  beforeEach(() => { vi.clearAllMocks(); });

  it('renders create form fields', () => {
    renderWithProviders(<CategoryForm onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Category/i })).toBeInTheDocument();
  });

  it('hides type field when editing', () => {
    const initialData = {
      id: '1', user_id: 'u1', name: 'Food', type: 'expense' as const,
      color: '#ef4444', icon: 'utensils', created_at: '', updated_at: '',
    };
    renderWithProviders(<CategoryForm initialData={initialData} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.queryByLabelText('Type')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update Category/i })).toBeInTheDocument();
  });

  it('shows validation error for empty name', async () => {
    renderWithProviders(<CategoryForm onSubmit={onSubmit} onCancel={onCancel} />);
    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.click(screen.getByRole('button', { name: /Create Category/i }));
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel clicked', async () => {
    renderWithProviders(<CategoryForm onSubmit={onSubmit} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders color palette buttons', () => {
    renderWithProviders(<CategoryForm onSubmit={onSubmit} onCancel={onCancel} />);
    const colorButtons = screen.getAllByLabelText(/Select color/);
    expect(colorButtons.length).toBe(16);
  });

  it('disables submit button when loading', () => {
    renderWithProviders(<CategoryForm onSubmit={onSubmit} onCancel={onCancel} loading={true} />);
    expect(screen.getByRole('button', { name: /Create Category/i })).toBeDisabled();
  });
});

