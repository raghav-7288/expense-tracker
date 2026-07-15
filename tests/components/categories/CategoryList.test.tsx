import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import CategoryList from '@/components/categories/CategoryList';
import { buildMergedCategory, buildSystemCategory } from '@/test/factories';

const mockMutateUpdate = vi.fn().mockResolvedValue({});
const mockMutateDelete = vi.fn().mockResolvedValue({});
const mockMutateHide = vi.fn().mockResolvedValue({});
const mockMutateCopy = vi.fn().mockResolvedValue({});

vi.mock('@/hooks/useCategories', () => ({
  useUpdateCategory: () => ({ mutateAsync: mockMutateUpdate, isPending: false }),
  useDeleteCategory: () => ({ mutateAsync: mockMutateDelete, isPending: false }),
  useHideCategory: () => ({ mutateAsync: mockMutateHide, isPending: false }),
  useCopyCategory: () => ({ mutateAsync: mockMutateCopy, isPending: false }),
}));

describe('CategoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders custom categories with edit/delete buttons', () => {
    const categories = [
      buildMergedCategory({ id: '1', name: 'Food', type: 'expense', color: '#ef4444' }),
      buildMergedCategory({ id: '2', name: 'Salary', type: 'income', color: '#10b981' }),
    ];
    renderWithProviders(<CategoryList categories={categories} />);
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit Food')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Food')).toBeInTheDocument();
  });

  it('renders system categories with copy/hide buttons', () => {
    const categories = [
      buildSystemCategory({ id: '1', name: 'Food & Dining' }),
    ];
    renderWithProviders(<CategoryList categories={categories} />);
    expect(screen.getByText('Food & Dining')).toBeInTheDocument();
    expect(screen.getByLabelText('Copy Food & Dining')).toBeInTheDocument();
    expect(screen.getByLabelText('Hide Food & Dining')).toBeInTheDocument();
    // System categories should NOT have edit/delete
    expect(screen.queryByLabelText('Edit Food & Dining')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Delete Food & Dining')).not.toBeInTheDocument();
  });

  it('opens edit modal on edit click', async () => {
    const categories = [buildMergedCategory({ id: '1', name: 'Food', type: 'expense' })];
    renderWithProviders(<CategoryList categories={categories} />);
    await userEvent.click(screen.getByLabelText('Edit Food'));
    expect(screen.getByText('Edit Category')).toBeInTheDocument();
  });

  it('opens delete confirmation on delete click', async () => {
    const categories = [buildMergedCategory({ id: '1', name: 'Food' })];
    renderWithProviders(<CategoryList categories={categories} />);
    await userEvent.click(screen.getByLabelText('Delete Food'));
    expect(screen.getByText('Delete Category')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
  });

  it('calls delete mutation and closes modal on confirm', async () => {
    const categories = [buildMergedCategory({ id: '1', name: 'Food' })];
    renderWithProviders(<CategoryList categories={categories} />);
    await userEvent.click(screen.getByLabelText('Delete Food'));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(mockMutateDelete).toHaveBeenCalledWith('1');
    });
  });

  it('closes delete modal on cancel', async () => {
    const categories = [buildMergedCategory({ id: '1', name: 'Food' })];
    renderWithProviders(<CategoryList categories={categories} />);
    await userEvent.click(screen.getByLabelText('Delete Food'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.queryByText('Delete Category')).not.toBeInTheDocument();
    });
  });

  it('closes edit modal on cancel within form', async () => {
    const categories = [buildMergedCategory({ id: '1', name: 'Food', type: 'expense' })];
    renderWithProviders(<CategoryList categories={categories} />);
    await userEvent.click(screen.getByLabelText('Edit Food'));
    expect(screen.getByText('Edit Category')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.queryByText('Edit Category')).not.toBeInTheDocument();
    });
  });

  it('renders category badge type', () => {
    const categories = [
      buildMergedCategory({ id: '1', name: 'Food', type: 'expense' }),
      buildMergedCategory({ id: '2', name: 'Salary', type: 'income' }),
    ];
    renderWithProviders(<CategoryList categories={categories} />);
    expect(screen.getByText('Expense')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
  });

  it('opens hide confirmation for system categories', async () => {
    const categories = [buildSystemCategory({ id: '1', name: 'Bills' })];
    renderWithProviders(<CategoryList categories={categories} />);
    await userEvent.click(screen.getByLabelText('Hide Bills'));
    expect(screen.getByText('Hide Category')).toBeInTheDocument();
  });

  it('calls copy mutation for system categories', async () => {
    const categories = [buildSystemCategory({ id: '1', name: 'Bills' })];
    renderWithProviders(<CategoryList categories={categories} />);
    await userEvent.click(screen.getByLabelText('Copy Bills'));
    expect(mockMutateCopy).toHaveBeenCalledWith('1');
  });
});
