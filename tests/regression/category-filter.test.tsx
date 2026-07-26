/**
 * Regression tests for CategoryFilter — ensures the setState-in-effect bug
 * is fixed and the search reset works without cascading renders.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryFilter from '@/components/analytics/CategoryFilter';
import type { MergedCategory } from '@/types';

afterEach(cleanup);

const categories: MergedCategory[] = [
  {
    id: '1', name: 'Food', type: 'expense', color: '#ef4444',
    icon: 'utensils', source: 'system', isDefault: true,
    isCustom: false, editable: false, deletable: false, source_category_id: null,
  },
  {
    id: '2', name: 'Transport', type: 'expense', color: '#3b82f6',
    icon: 'car', source: 'system', isDefault: true,
    isCustom: false, editable: false, deletable: false, source_category_id: null,
  },
  {
    id: '3', name: 'Salary', type: 'income', color: '#10b981',
    icon: 'briefcase', source: 'system', isDefault: true,
    isCustom: false, editable: false, deletable: false, source_category_id: null,
  },
];

describe('CategoryFilter Regression', () => {
  it('opens dropdown when clicked', async () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /filter by category/i }));
    expect(screen.getByPlaceholderText('Search categories…')).toBeInTheDocument();
  });

  it('search field is empty on re-open', async () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);

    // Open
    await userEvent.click(screen.getByRole('button', { name: /filter by category/i }));
    const searchInput = screen.getByPlaceholderText('Search categories…');

    // Type something
    await userEvent.type(searchInput, 'Food');
    expect(searchInput).toHaveValue('Food');

    // Close by pressing Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    // Re-open — search should be cleared
    await userEvent.click(screen.getByRole('button', { name: /filter by category/i }));
    const newSearchInput = screen.getByPlaceholderText('Search categories…');
    expect(newSearchInput).toHaveValue('');
  });

  it('shows all categories when selectedIds is null', async () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /filter by category/i }));
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('triggers onChange with array when deselecting from "all"', async () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /filter by category/i }));

    // Click on "Food" to deselect it from "all"
    await userEvent.click(screen.getByText('Food'));
    expect(onChange).toHaveBeenCalledWith(['2', '3']);
  });

  it('triggers onChange(null) when all categories selected again', async () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={['1', '2']} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /filter by category/i }));

    // Click "Salary" to select it (adds to the 2 already selected = all 3)
    await userEvent.click(screen.getByText('Salary'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('shows correct label for single selection', () => {
    render(<CategoryFilter categories={categories} selectedIds={['1']} onChange={vi.fn()} />);
    // The trigger button text includes the category name
    expect(screen.getByRole('button', { name: /filter by category/i })).toHaveTextContent('Food');
  });

  it('shows "No Categories" when empty array', () => {
    render(<CategoryFilter categories={categories} selectedIds={[]} onChange={vi.fn()} />);
    expect(screen.getByText('No Categories')).toBeInTheDocument();
  });

  it('calls onChange([]) when Clear All is clicked', async () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /filter by category/i }));
    await userEvent.click(screen.getByText('Clear All'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('calls onChange(null) when Select All is clicked', async () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={['1']} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /filter by category/i }));
    await userEvent.click(screen.getByText('Select All'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('filters categories by search input', async () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /filter by category/i }));

    await userEvent.type(screen.getByPlaceholderText('Search categories…'), 'Sal');
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.queryByText('Food')).not.toBeInTheDocument();
    expect(screen.queryByText('Transport')).not.toBeInTheDocument();
  });
});


