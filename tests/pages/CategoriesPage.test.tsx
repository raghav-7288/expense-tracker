import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import CategoriesPage from '@/pages/CategoriesPage';

vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(),
  useHiddenCategories: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useCreateCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useHideCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCopyCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRestoreCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { useCategories, useHiddenCategories } from '@/hooks/useCategories';
const mockUseCategories = vi.mocked(useCategories);
const mockUseHiddenCategories = vi.mocked(useHiddenCategories);

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
    expect(screen.getByText('No categories found')).toBeInTheDocument();
  });

  it('renders category list when data available', () => {
    mockUseCategories.mockReturnValue({
      data: [
        {
          id: '1', name: 'Food', type: 'expense',
          color: '#ef4444', icon: 'utensils',
          source: 'user', isDefault: false, isCustom: true,
          editable: true, deletable: true, source_category_id: null,
        },
      ],
      isLoading: false,
    } as never);

    renderWithProviders(<CategoriesPage />);
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('opens create modal when Add Custom Category clicked', async () => {
    mockUseCategories.mockReturnValue({
      data: [],
      isLoading: false,
    } as never);

    renderWithProviders(<CategoriesPage />);
    await userEvent.click(screen.getAllByRole('button', { name: /Custom Category/i })[0]!);
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
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('filters categories by type when filter button clicked', async () => {
    mockUseCategories.mockReturnValue({
      data: [
        {
          id: '1', name: 'Food', type: 'expense',
          color: '#ef4444', icon: 'utensils',
          source: 'user', isDefault: false, isCustom: true,
          editable: true, deletable: true, source_category_id: null,
        },
      ],
      isLoading: false,
    } as never);

    renderWithProviders(<CategoriesPage />);
    await userEvent.click(screen.getByText('Income'));
    // useCategories should be called with 'income' type
    expect(mockUseCategories).toHaveBeenCalledWith('income');
  });

  it('shows custom empty state when custom filter selected with no results', async () => {
    mockUseCategories.mockReturnValue({
      data: [
        {
          id: '1', name: 'Salary', type: 'income',
          color: '#10b981', icon: 'briefcase',
          source: 'system', isDefault: true, isCustom: false,
          editable: false, deletable: false, source_category_id: null,
        },
      ],
      isLoading: false,
    } as never);

    renderWithProviders(<CategoriesPage />);
    await userEvent.click(screen.getByText('Custom'));
    expect(screen.getByText('No custom categories yet')).toBeInTheDocument();
  });

  it('renders hidden categories section when hidden categories exist', () => {
    mockUseCategories.mockReturnValue({
      data: [
        {
          id: '1', name: 'Food', type: 'expense',
          color: '#ef4444', icon: 'utensils',
          source: 'user', isDefault: false, isCustom: true,
          editable: true, deletable: true, source_category_id: null,
        },
      ],
      isLoading: false,
    } as never);

    mockUseHiddenCategories.mockReturnValue({
      data: [
        { id: 'h1', name: 'Hidden Cat', type: 'expense', color: '#000', icon: 'tag' },
      ],
      isLoading: false,
    } as never);

    renderWithProviders(<CategoriesPage />);
    expect(screen.getByText('Hidden Categories (1)')).toBeInTheDocument();
    expect(screen.getByText('Hidden Cat')).toBeInTheDocument();
    expect(screen.getByLabelText('Restore Hidden Cat')).toBeInTheDocument();
  });

  it('shows loading state for hidden categories', () => {
    mockUseCategories.mockReturnValue({
      data: [
        {
          id: '1', name: 'Food', type: 'expense',
          color: '#ef4444', icon: 'utensils',
          source: 'user', isDefault: false, isCustom: true,
          editable: true, deletable: true, source_category_id: null,
        },
      ],
      isLoading: false,
    } as never);

    mockUseHiddenCategories.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never);

    renderWithProviders(<CategoriesPage />);
    expect(screen.getByText('Loading hidden categories...')).toBeInTheDocument();
  });
});
