import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryFilter from '@/components/analytics/CategoryFilter';
import type { MergedCategory } from '@/types';

function buildCat(overrides: Partial<MergedCategory> = {}): MergedCategory {
  return {
    id: 'cat-1',
    name: 'Food',
    type: 'expense',
    color: '#ef4444',
    icon: 'utensils',
    source: 'user',
    isDefault: false,
    isCustom: true,
    editable: true,
    deletable: true,
    source_category_id: null,
    ...overrides,
  };
}

const categories: MergedCategory[] = [
  buildCat({ id: 'cat-1', name: 'Food', type: 'expense', color: '#ef4444' }),
  buildCat({ id: 'cat-2', name: 'Transport', type: 'expense', color: '#3b82f6' }),
  buildCat({ id: 'cat-3', name: 'Salary', type: 'income', color: '#10b981' }),
  buildCat({ id: 'cat-4', name: 'Entertainment', type: 'expense', color: '#8b5cf6' }),
  buildCat({ id: 'cat-5', name: 'Freelance', type: 'income', color: '#06b6d4' }),
];

afterEach(() => {
  cleanup();
});

describe('CategoryFilter', () => {
  it('renders trigger button with "All Categories" when selectedIds is null', () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('renders trigger button with "No Categories" when selectedIds is empty', () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={[]} onChange={onChange} />);
    expect(screen.getByText('No Categories')).toBeInTheDocument();
  });

  it('renders trigger with single category name', () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={['cat-1']} onChange={onChange} />);
    // The trigger shows the category name, and a chip also shows it
    expect(screen.getByRole('button', { name: /filter by category/i })).toBeInTheDocument();
    expect(screen.getAllByText('Food').length).toBeGreaterThanOrEqual(1);
  });

  it('renders trigger with count for multiple selected', () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={['cat-1', 'cat-2']} onChange={onChange} />);
    expect(screen.getByText('2 Categories')).toBeInTheDocument();
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search categories…')).toBeInTheDocument();
  });

  it('shows all categories in dropdown', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    for (const cat of categories) {
      expect(screen.getByRole('option', { name: new RegExp(cat.name) })).toBeInTheDocument();
    }
  });

  it('filters categories by search', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    const searchInput = screen.getByPlaceholderText('Search categories…');
    await user.type(searchInput, 'Foo');

    // Only "Food" should be visible
    expect(screen.getByRole('option', { name: /Food/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Transport/ })).not.toBeInTheDocument();
  });

  it('deselecting a category from "all" calls onChange with remaining IDs', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    // Click "Food" to deselect it
    await user.click(screen.getByRole('option', { name: /Food/ }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const result = onChange.mock.calls[0]?.[0] as string[];
    // Should have all IDs except cat-1
    expect(result).toHaveLength(4);
    expect(result).not.toContain('cat-1');
    expect(result).toContain('cat-2');
    expect(result).toContain('cat-3');
  });

  it('toggling a category in explicit mode adds/removes it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter
        categories={categories}
        selectedIds={['cat-1', 'cat-2']}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    // Deselect "Food" (cat-1)
    await user.click(screen.getByRole('option', { name: /Food/ }));
    expect(onChange).toHaveBeenCalledWith(['cat-2']);
  });

  it('selecting all IDs switches back to null', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    // 4 out of 5 selected — selecting the missing one should go back to null
    render(
      <CategoryFilter
        categories={categories}
        selectedIds={['cat-1', 'cat-2', 'cat-3', 'cat-4']}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    // Select "Freelance" (cat-5) → all selected → should call with null
    await user.click(screen.getByRole('option', { name: /Freelance/ }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('Select All button calls onChange with null', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter
        categories={categories}
        selectedIds={['cat-1']}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    await user.click(screen.getByText('Select All'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('Clear All button calls onChange with empty array', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter
        categories={categories}
        selectedIds={null}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    await user.click(screen.getByText('Clear All'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows selected count badge', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter
        categories={categories}
        selectedIds={['cat-1', 'cat-3']}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('shows chips for selected categories (up to 5)', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        categories={categories}
        selectedIds={['cat-1', 'cat-2']}
        onChange={onChange}
      />,
    );
    // Chips should be visible outside the dropdown
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('chip remove button deselects category', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter
        categories={categories}
        selectedIds={['cat-1', 'cat-2']}
        onChange={onChange}
      />,
    );

    // Find the remove button for "Food"
    const removeBtn = screen.getByRole('button', { name: /Remove Food/i });
    await user.click(removeBtn);

    expect(onChange).toHaveBeenCalledWith(['cat-2']);
  });

  it('shows loading state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter
        categories={[]}
        selectedIds={null}
        onChange={onChange}
        loading
      />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    expect(screen.getByText('Loading categories…')).toBeInTheDocument();
  });

  it('shows empty state when no categories match search', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    const searchInput = screen.getByPlaceholderText('Search categories…');
    await user.type(searchInput, 'nonexistent');
    expect(screen.getByText('No categories match your search')).toBeInTheDocument();
  });

  it('has correct aria attributes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: /filter by category/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('does not show chips when all are selected (null)', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />,
    );
    // No chips rendered — only trigger button
    const removeButtons = container.querySelectorAll('[aria-label^="Remove"]');
    expect(removeButtons).toHaveLength(0);
  });
});


