import Input from '@/components/ui/Input';
import { Search } from 'lucide-react';
import type { LoanFilters } from '@/types';

interface LoanFilterBarProps {
  filters: LoanFilters;
  onChange: (filters: LoanFilters) => void;
  resultCount?: number;
}

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'lent', label: 'Lent' },
  { value: 'borrowed', label: 'Borrowed' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'settled', label: 'Settled' },
];

// Matches the gray "pill" filter style used on the Transactions page
// (light: bg-gray-100 / dark: #283848 via the .filter-select CSS rules).
const filterSelectClass =
  'filter-select h-9 px-3 pr-7 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer appearance-none touch-manipulation';

export default function LoanFilterBar({ filters, onChange, resultCount }: LoanFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
      <div className="flex-1 w-full sm:max-w-xs">
        <Input
          placeholder="Search by name..."
          leftIcon={<Search size={15} />}
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
        />
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <select
          aria-label="Filter by loan type"
          value={filters.type ?? 'all'}
          onChange={(e) => onChange({ ...filters, type: e.target.value as LoanFilters['type'] })}
          className={`${filterSelectClass} flex-1 sm:w-32`}
        >
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          aria-label="Filter by loan status"
          value={filters.status ?? 'all'}
          onChange={(e) => onChange({ ...filters, status: e.target.value as LoanFilters['status'] })}
          className={`${filterSelectClass} flex-1 sm:w-36`}
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {resultCount !== undefined && (
        <p className="text-xs text-gray-400 self-center hidden sm:block">
          {resultCount} loan{resultCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

