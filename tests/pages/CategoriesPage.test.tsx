import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import CategoriesPage from '@/pages/CategoriesPage';

vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(),
  useCreateCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { useCategories } from '@/hooks/useCategories';
const mockUseCategories = vi.mocked(useCategories);

describe('CategoriesPage', () => {
  it('shows skeleton when loading', () => {
    mockUseCategories.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never);

    const { container } = renderWithProviders(<CategoriesPage />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows empty state when no categories', () => {
    mockUseCategories.mockReturnValue({
      data: [],
      isLoading: false,
    } as never);

    renderWithProviders(<CategoriesPage />);
    expect(screen.getByText('Organize with categories')).toBeInTheDocument();
  });

  it('renders category list when data available', () => {
    mockUseCategories.mockReturnValue({
      data: [
        {
          id: '1', user_id: 'u1', name: 'Food', type: 'expense',
          color: '#ef4444', icon: 'utensils', created_at: '', updated_at: '',
        },
      ],
      isLoading: false,
    } as never);

    renderWithProviders(<CategoriesPage />);
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('opens create modal when Add Category clicked', async () => {
    mockUseCategories.mockReturnValue({
      data: [],
      isLoading: false,
    } as never);

    renderWithProviders(<CategoriesPage />);
    await userEvent.click(screen.getAllByRole('button', { name: /Add Category/i })[0]!);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('renders type filter buttons', () => {
    mockUseCategories.mockReturnValue({
      data: [],
      isLoading: false,
    } as never);

    renderWithProviders(<CategoriesPage />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Expense')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
  });
});


