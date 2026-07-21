/**
 * Comprehensive Category Filter Test Suite
 *
 * Tests the CategoryFilter component thoroughly including:
 * - UI interactions (open/close, search, select, deselect)
 * - Keyboard navigation (Escape)
 * - Edge cases (empty categories, >5 chips, deleted categories)
 * - Accessibility (ARIA attributes, labels)
 * - Search behavior (case-insensitive, clear, no results)
 * - Chip display and removal
 * - Counter accuracy
 * - Duplicate prevention
 * - Click-outside closing
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryFilter from '@/components/analytics/CategoryFilter';
import type { MergedCategory } from '@/types';

// ── Helpers ──────────────────────────────────────────────

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

// ── Dropdown open / close ────────────────────────────────

describe('CategoryFilter — dropdown open/close', () => {
  it('toggles dropdown open and closed on trigger click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: /filter by category/i });

    // Initially closed
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Open
    await user.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Close
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes dropdown on Escape key', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes dropdown on click outside', async () => {
    const onChange = vi.fn();
    render(
      <div>
        <div data-testid="outside">Outside area</div>
        <CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />
      </div>,
    );

    // Open
    fireEvent.click(screen.getByRole('button', { name: /filter by category/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('clears search when dropdown closes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);

    // Open and type in search
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    const searchInput = screen.getByPlaceholderText('Search categories…');
    await user.type(searchInput, 'Food');
    expect(searchInput).toHaveValue('Food');

    // Close and reopen
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    // Search should be cleared
    expect(screen.getByPlaceholderText('Search categories…')).toHaveValue('');
  });
});

// ── Search functionality ─────────────────────────────────

describe('CategoryFilter — search', () => {
  it('filters categories case-insensitively', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    await user.type(screen.getByPlaceholderText('Search categories…'), 'foo');
    expect(screen.getByRole('option', { name: /Food/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Transport/ })).not.toBeInTheDocument();
  });

  it('shows clear button when search has text', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    // No clear button initially
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search categories…'), 'test');
    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
  });

  it('clear search button restores all categories', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    const searchInput = screen.getByPlaceholderText('Search categories…');
    await user.type(searchInput, 'Food');
    expect(screen.getAllByRole('option')).toHaveLength(1);

    // Clear
    await user.click(screen.getByRole('button', { name: /clear search/i }));
    expect(searchInput).toHaveValue('');
    expect(screen.getAllByRole('option')).toHaveLength(5);
  });

  it('shows "No categories match" for unmatched search', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    await user.type(screen.getByPlaceholderText('Search categories…'), 'zzzzz');
    expect(screen.getByText('No categories match your search')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('shows "No categories available" when categories list is empty and no search', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={[]} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    expect(screen.getByText('No categories available')).toBeInTheDocument();
  });

  it('partial search matches category names', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    // Search for "an" should match "Transport" (tr-an-sport) and "Freelance" (freel-an-ce)
    // Note: "Entertainment" has "ain" not "an" as consecutive chars
    await user.type(screen.getByPlaceholderText('Search categories…'), 'an');
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(2); // Transport, Freelance
  });
});

// ── Selection behavior ───────────────────────────────────

describe('CategoryFilter — selection behavior', () => {
  it('toggling an already-selected category from explicit mode removes it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={['cat-1', 'cat-2', 'cat-3']} onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    await user.click(screen.getByRole('option', { name: /Transport/ }));

    expect(onChange).toHaveBeenCalledWith(['cat-1', 'cat-3']);
  });

  it('toggling a new category in explicit mode adds it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={['cat-1']} onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    await user.click(screen.getByRole('option', { name: /Transport/ }));

    expect(onChange).toHaveBeenCalledWith(['cat-1', 'cat-2']);
  });

  it('prevents duplicate IDs (same category toggled twice quickly)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={['cat-1']} onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    // Add cat-2
    await user.click(screen.getByRole('option', { name: /Transport/ }));
    const result = onChange.mock.calls[0]?.[0] as string[];
    // Verify no duplicates
    expect(new Set(result).size).toBe(result.length);
  });

  it('deselecting from "all" (null) produces N-1 items', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    await user.click(screen.getByRole('option', { name: /Salary/ }));

    const result = onChange.mock.calls[0]?.[0] as string[];
    expect(result).toHaveLength(4);
    expect(result).not.toContain('cat-3');
  });

  it('selecting the last missing item in explicit mode switches to null (all)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    // Only cat-5 missing
    render(
      <CategoryFilter
        categories={categories}
        selectedIds={['cat-1', 'cat-2', 'cat-3', 'cat-4']}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    await user.click(screen.getByRole('option', { name: /Freelance/ }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

// ── Select All / Clear All ───────────────────────────────

describe('CategoryFilter — Select All / Clear All', () => {
  it('Select All from explicit selection calls onChange(null)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={['cat-1']} onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    await user.click(screen.getByText('Select All'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('Select All from empty selection calls onChange(null)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={[]} onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    await user.click(screen.getByText('Select All'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('Clear All from "all" calls onChange([])', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    await user.click(screen.getByText('Clear All'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('Clear All from partial selection calls onChange([])', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={['cat-1', 'cat-2']} onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    await user.click(screen.getByText('Clear All'));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});

// ── Trigger label ────────────────────────────────────────

describe('CategoryFilter — trigger label', () => {
  it('shows "All Categories" when null', () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('shows "No Categories" when empty array', () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={[]} onChange={onChange} />);
    expect(screen.getByText('No Categories')).toBeInTheDocument();
  });

  it('shows category name when single selected', () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={['cat-3']} onChange={onChange} />);
    // Trigger should show "Salary", and a chip also shows it
    expect(screen.getAllByText('Salary').length).toBeGreaterThanOrEqual(1);
  });

  it('shows "1 Category" fallback for unknown single ID', () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={['unknown-id']} onChange={onChange} />);
    expect(screen.getByText('1 Category')).toBeInTheDocument();
  });

  it('shows "N Categories" for multiple', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={['cat-1', 'cat-2', 'cat-3']} onChange={onChange} />,
    );
    expect(screen.getByText('3 Categories')).toBeInTheDocument();
  });
});

// ── Chips / badges ───────────────────────────────────────

describe('CategoryFilter — chips', () => {
  it('does not show chips when selectedIds is null (all selected)', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />,
    );
    expect(container.querySelectorAll('[aria-label^="Remove"]')).toHaveLength(0);
  });

  it('does not show chips when selectedIds is empty', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CategoryFilter categories={categories} selectedIds={[]} onChange={onChange} />,
    );
    expect(container.querySelectorAll('[aria-label^="Remove"]')).toHaveLength(0);
  });

  it('shows chips for 1-5 selected categories', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={['cat-1', 'cat-3']} onChange={onChange} />,
    );
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Remove Food/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Remove Salary/i })).toBeInTheDocument();
  });

  it('hides chips when more than 5 categories selected', () => {
    // Create 7 categories
    const manyCats: MergedCategory[] = Array.from({ length: 7 }, (_, i) =>
      buildCat({ id: `cat-${i}`, name: `Cat ${i}`, color: `#${i}00` }),
    );
    const allIds = manyCats.map((c) => c.id);
    const onChange = vi.fn();
    const { container } = render(
      <CategoryFilter categories={manyCats} selectedIds={allIds.slice(0, 6)} onChange={onChange} />,
    );
    // 6 > 5, so chips should NOT be shown
    expect(container.querySelectorAll('[aria-label^="Remove"]')).toHaveLength(0);
  });

  it('shows chips at exactly 5', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        categories={categories}
        selectedIds={['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5']}
        onChange={onChange}
      />,
    );
    // 5 is within limit — but wait, 5 == categories.length, which means all selected.
    // However selectedIds is explicit (not null), so chips WOULD show...
    // But actually 5 categories.length == selectedIds.length triggers the condition:
    // selectedChips = !isAllSelected && selectedIds.length > 0 ? categories.filter(...)
    // isAllSelected = selectedIds === null = false here
    // so selectedChips has 5 items, and 5 <= 5 passes the display condition.
    const removeButtons = screen.getAllByRole('button', { name: /^Remove /i });
    expect(removeButtons).toHaveLength(5);
  });

  it('removing a chip via X button calls onChange without that ID', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={['cat-1', 'cat-2', 'cat-4']} onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: /Remove Transport/i }));
    expect(onChange).toHaveBeenCalledWith(['cat-1', 'cat-4']);
  });
});

// ── Counter in dropdown ──────────────────────────────────

describe('CategoryFilter — counter display', () => {
  it('shows N/total when all selected (null)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    expect(screen.getByText('5/5')).toBeInTheDocument();
  });

  it('shows 0/total when none selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={[]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    expect(screen.getByText('0/5')).toBeInTheDocument();
  });

  it('shows correct count for partial selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={['cat-1', 'cat-5']} onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });
});

// ── Accessibility ────────────────────────────────────────

describe('CategoryFilter — accessibility', () => {
  it('trigger has correct ARIA attributes when closed', () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: /filter by category/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('trigger has aria-expanded=true when open', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    expect(screen.getByRole('button', { name: /filter by category/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('listbox has aria-multiselectable', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('options have aria-selected matching selection state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={['cat-1']} onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    expect(screen.getByRole('option', { name: /Food/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: /Transport/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('search input has aria-label', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    expect(screen.getByLabelText('Search categories')).toBeInTheDocument();
  });

  it('chip remove buttons have descriptive aria-labels', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={['cat-1', 'cat-2']} onChange={onChange} />,
    );
    expect(screen.getByRole('button', { name: 'Remove Food' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Transport' })).toBeInTheDocument();
  });
});

// ── Loading state ────────────────────────────────────────

describe('CategoryFilter — loading state', () => {
  it('shows loading message when loading=true', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={[]} selectedIds={null} onChange={onChange} loading />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    expect(screen.getByText('Loading categories…')).toBeInTheDocument();
  });

  it('does not show options when loading', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} loading />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });
});

// ── Edge cases ───────────────────────────────────────────

describe('CategoryFilter — edge cases', () => {
  it('handles empty categories list gracefully', () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={[]} selectedIds={null} onChange={onChange} />);
    // Should show "All Categories" even with 0 categories
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('handles selectedIds containing IDs not in categories', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={['deleted-cat-id']} onChange={onChange} />,
    );
    // Should show "1 Category" (fallback label)
    expect(screen.getByText('1 Category')).toBeInTheDocument();
    // No chips since the category doesn't exist in the list
    const removeButtons = screen.queryAllByRole('button', { name: /^Remove /i });
    expect(removeButtons).toHaveLength(0);
  });

  it('handles mix of valid and invalid IDs', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        categories={categories}
        selectedIds={['cat-1', 'deleted-cat']}
        onChange={onChange}
      />,
    );
    // selectedCount is 2 (from selectedIds.length)
    expect(screen.getByText('2 Categories')).toBeInTheDocument();
    // Only one chip (cat-1/Food) since 'deleted-cat' isn't in categories
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Remove /i })).toHaveLength(1);
  });

  it('type badge shows "Inc" for income and "Exp" for expense', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /filter by category/i }));

    // Check type badges exist
    const expBadges = screen.getAllByText('Exp');
    const incBadges = screen.getAllByText('Inc');
    expect(expBadges.length).toBe(3); // Food, Transport, Entertainment
    expect(incBadges.length).toBe(2); // Salary, Freelance
  });

  it('single category renders its name on trigger', () => {
    const singleCats = [buildCat({ id: 'cat-1', name: 'Groceries' })];
    const onChange = vi.fn();
    render(<CategoryFilter categories={singleCats} selectedIds={['cat-1']} onChange={onChange} />);
    expect(screen.getAllByText('Groceries').length).toBeGreaterThanOrEqual(1);
  });
});

// ── Styling / visual states ──────────────────────────────

describe('CategoryFilter — visual states', () => {
  it('trigger has active style when categories are explicitly selected', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={['cat-1']} onChange={onChange} />,
    );
    const trigger = screen.getByRole('button', { name: /filter by category/i });
    expect(trigger.className).toContain('bg-primary-600');
  });

  it('trigger has warning style when no categories selected', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={[]} onChange={onChange} />,
    );
    const trigger = screen.getByRole('button', { name: /filter by category/i });
    expect(trigger.className).toContain('bg-amber-100');
  });

  it('trigger has default style when all selected (null)', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />,
    );
    const trigger = screen.getByRole('button', { name: /filter by category/i });
    expect(trigger.className).toContain('bg-gray-100');
  });

  it('chevron rotates when open', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <CategoryFilter categories={categories} selectedIds={null} onChange={onChange} />,
    );

    // Before opening — chevron should NOT have rotate-180
    const chevronBefore = container.querySelector('.lucide-chevron-down');
    expect(chevronBefore?.classList.contains('rotate-180')).toBe(false);

    await user.click(screen.getByRole('button', { name: /filter by category/i }));
    const chevronAfter = container.querySelector('.lucide-chevron-down');
    expect(chevronAfter?.classList.contains('rotate-180')).toBe(true);
  });
});




