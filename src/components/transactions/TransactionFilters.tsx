import { useCategories } from '@/hooks/useCategories';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { TransactionFilters } from '@/types';

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}

export default function TransactionFilterBar({ filters, onChange }: TransactionFiltersProps) {
  const { data: categories } = useCategories();

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
  ];

  function handleSortChange(value: string) {
    const [sort_by, sort_order] = value.split('-') as ['date' | 'amount', 'asc' | 'desc'];
    onChange({ ...filters, sort_by, sort_order });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <Input
        placeholder="Search transactions..."
        value={filters.search ?? ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />

      <Select
        options={typeOptions}
        value={filters.type ?? 'all'}
        onChange={(e) => onChange({ ...filters, type: e.target.value as TransactionFilters['type'] })}
      />

      <Select
        options={categoryOptions}
        value={filters.category_id ?? ''}
        onChange={(e) => onChange({ ...filters, category_id: e.target.value || undefined })}
      />

      <Input
        type="date"
        value={filters.date_from ?? ''}
        onChange={(e) => onChange({ ...filters, date_from: e.target.value || undefined })}
        placeholder="From date"
      />

      <Select
        options={sortOptions}
        value={`${filters.sort_by ?? 'date'}-${filters.sort_order ?? 'desc'}`}
        onChange={(e) => handleSortChange(e.target.value)}
      />
    </div>
  );
}

