import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import Input from '@/components/ui/Input';
import { Search, SlidersHorizontal, X, Calendar } from 'lucide-react';
import type { TransactionFilters } from '@/types';

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  resultCount?: number;
}

type DateMode = 'none' | 'single' | 'range';

export default function TransactionFilterBar({ filters, onChange, resultCount }: TransactionFiltersProps) {
  const { data: categories } = useCategories();
  const [dateModeOverride, setDateModeOverride] = useState<DateMode | null>(null);

  // Derive dateMode from filters, but allow local override for user interactions
  const derivedDateMode: DateMode =
    filters.date_from && filters.date_to && filters.date_from !== filters.date_to
      ? 'range'
      : filters.date_from
        ? 'single'
        : 'none';
  // Use the user's explicit selection if set, otherwise fall back to derived
  const dateMode = dateModeOverride ?? derivedDateMode;

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...(categories ?? []).map((c) => ({ value: c.id, label: c.name })),
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
  ];

  const sortOptions = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'amount-desc', label: 'Highest Amount' },
    { value: 'amount-asc', label: 'Lowest Amount' },
    { value: 'description-asc', label: 'A–Z' },
    { value: 'description-desc', label: 'Z–A' },
  ];

  function handleSortChange(value: string) {
    const [sort_by, sort_order] = value.split('-') as ['date' | 'amount' | 'description', 'asc' | 'desc'];
    onChange({ ...filters, sort_by, sort_order });
  }

  function handleDateModeChange(mode: DateMode) {
    setDateModeOverride(mode);
    if (mode === 'none') {
      onChange({ ...filters, date_from: undefined, date_to: undefined });
    } else if (mode === 'single') {
      // Single date: set both from & to to same value to filter exact day
      const date = filters.date_from;
      onChange({ ...filters, date_from: date, date_to: date });
    }
  }

  const hasActiveFilters = !!(filters.search || (filters.type && filters.type !== 'all') || filters.category_id || filters.date_from || filters.date_to);

  function clearFilters() {
    setDateModeOverride(null);
    onChange({ sort_by: filters.sort_by, sort_order: filters.sort_order });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Search row */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search transactions..."
              value={filters.search ?? ''}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              leftIcon={<Search size={15} />}
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filters row */}
      <div className="px-3 py-2.5 flex flex-wrap items-center gap-2">
        <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0 hidden sm:block" />
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto sm:flex-1 min-w-0">
          <select
            value={filters.type ?? 'all'}
            onChange={(e) => onChange({ ...filters, type: e.target.value as TransactionFilters['type'] })}
            className="w-full sm:w-auto px-2.5 py-2 sm:py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          >
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={filters.category_id ?? ''}
            onChange={(e) => onChange({ ...filters, category_id: e.target.value || undefined })}
            className="w-full sm:w-auto px-2.5 py-2 sm:py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all sm:max-w-[140px] truncate"
          >
            {categoryOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Date filter mode selector */}
          <select
            value={dateMode}
            onChange={(e) => handleDateModeChange(e.target.value as DateMode)}
            className="w-full sm:w-auto px-2.5 py-2 sm:py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          >
            <option value="none">All Dates</option>
            <option value="single">Specific Date</option>
            <option value="range">Date Range</option>
          </select>

          <select
            value={`${filters.sort_by ?? 'date'}-${filters.sort_order ?? 'desc'}`}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full sm:w-auto px-2.5 py-2 sm:py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date picker row - shows when date mode is single or range */}
      {dateMode !== 'none' && (
        <div className="px-3 py-2.5 border-t border-gray-100 flex flex-wrap items-center gap-2">
          <Calendar size={14} className="text-gray-400 flex-shrink-0" />
          <input
            type="date"
            aria-label={dateMode === 'range' ? 'From date' : 'Date'}
            value={filters.date_from ?? ''}
            onChange={(e) => {
              const val = e.target.value || undefined;
              if (dateMode === 'single') {
                onChange({ ...filters, date_from: val, date_to: val });
              } else {
                onChange({ ...filters, date_from: val });
              }
            }}
            className="flex-1 min-w-[130px] px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          {dateMode === 'range' && (
            <>
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                aria-label="To date"
                value={filters.date_to ?? ''}
                onChange={(e) => onChange({ ...filters, date_to: e.target.value || undefined })}
                className="flex-1 min-w-[130px] px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </>
          )}
        </div>
      )}

      {/* Result count */}
      {resultCount !== undefined && (
        <div className="px-4 py-2 border-t border-gray-100">
          <span className="text-[11px] text-gray-400">
            {resultCount} transaction{resultCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

