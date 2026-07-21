import { useState, useRef, useEffect, useCallback } from 'react';
import { Filter, Search, X, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { MergedCategory } from '@/types';

interface CategoryFilterProps {
  categories: MergedCategory[];
  /** `null` = all categories (default). `string[]` = explicit selection. */
  selectedIds: string[] | null;
  onChange: (ids: string[] | null) => void;
  loading?: boolean;
}

export default function CategoryFilter({
  categories,
  selectedIds,
  onChange,
  loading,
}: CategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isAllSelected = selectedIds === null;
  const selectedCount = isAllSelected ? categories.length : selectedIds.length;

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchRef.current?.focus());
    } else {
      setSearch('');
    }
  }, [open]);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleToggle = useCallback(
    (id: string) => {
      if (isAllSelected) {
        // Deselecting one from "all" → explicit list minus the toggled one
        onChange(categories.filter((c) => c.id !== id).map((c) => c.id));
      } else {
        const exists = selectedIds.includes(id);
        const next = exists
          ? selectedIds.filter((sid) => sid !== id)
          : [...selectedIds, id];
        // If all are now selected, switch back to null (= all)
        onChange(next.length === categories.length ? null : next);
      }
    },
    [isAllSelected, selectedIds, categories, onChange],
  );

  const handleSelectAll = useCallback(() => onChange(null), [onChange]);
  const handleClearAll = useCallback(() => onChange([]), [onChange]);

  function isSelected(id: string): boolean {
    return isAllSelected || selectedIds.includes(id);
  }

  // Label for the trigger button
  let triggerLabel: string;
  if (isAllSelected) {
    triggerLabel = 'All Categories';
  } else if (selectedCount === 0) {
    triggerLabel = 'No Categories';
  } else if (selectedCount === 1) {
    const cat = categories.find((c) => c.id === selectedIds[0]);
    triggerLabel = cat?.name ?? '1 Category';
  } else {
    triggerLabel = `${selectedCount} Categories`;
  }

  // Selected chips (only when explicitly filtered, not "all")
  const selectedChips = !isAllSelected && selectedIds.length > 0
    ? categories.filter((c) => selectedIds.includes(c.id))
    : [];

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Filter by category"
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
          !isAllSelected && selectedCount > 0
            ? 'bg-primary-600 text-white shadow-sm'
            : !isAllSelected && selectedCount === 0
              ? 'bg-amber-100 text-amber-700 border border-amber-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        )}
      >
        <Filter size={13} />
        {triggerLabel}
        <ChevronDown
          size={12}
          className={cn('transition-transform', open && 'rotate-180')}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label="Category selection"
          className={cn(
            'absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-80',
            'rounded-xl border border-gray-200 bg-white shadow-lg',
            'animate-[slideUp_150ms_ease-out]',
          )}
        >
          {/* Search */}
          <div className="p-2.5 border-b border-gray-100">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search categories…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                aria-label="Search categories"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Select All / Clear All */}
          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-gray-100">
            <button
              type="button"
              onClick={handleSelectAll}
              className={cn(
                'px-2 py-1 rounded text-[11px] font-medium transition-colors',
                isAllSelected
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className={cn(
                'px-2 py-1 rounded text-[11px] font-medium transition-colors',
                selectedCount === 0 && !isAllSelected
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              Clear All
            </button>
            <span className="ml-auto text-[11px] text-gray-400">
              {selectedCount}/{categories.length}
            </span>
          </div>

          {/* Category list */}
          <div className="max-h-56 overflow-y-auto py-1 scrollbar-none">
            {loading ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                Loading categories…
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                {search ? 'No categories match your search' : 'No categories available'}
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const checked = isSelected(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => handleToggle(cat.id)}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors',
                      'hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none',
                      checked && 'bg-primary-50/50',
                    )}
                  >
                    {/* Checkbox indicator */}
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
                        checked
                          ? 'bg-primary-600 border-primary-600'
                          : 'border-gray-300',
                      )}
                    >
                      {checked && <Check size={10} className="text-white" />}
                    </div>

                    {/* Category color dot */}
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />

                    {/* Category name */}
                    <span className="text-xs text-gray-700 truncate flex-1">
                      {cat.name}
                    </span>

                    {/* Type badge */}
                    <span
                      className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0',
                        cat.type === 'income'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-red-50 text-red-600',
                      )}
                    >
                      {cat.type === 'income' ? 'Inc' : 'Exp'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Selected chips (shown when explicitly filtered) */}
      {selectedChips.length > 0 && selectedChips.length <= 5 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedChips.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-700"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
              <button
                type="button"
                onClick={() => handleToggle(cat.id)}
                className="ml-0.5 text-gray-400 hover:text-gray-600"
                aria-label={`Remove ${cat.name}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

