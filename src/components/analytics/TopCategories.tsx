import ChartCard from '@/components/analytics/ChartCard';
import { formatCurrency } from '@/utils/formatCurrency';
import type { CategoryBreakdownItem } from '@/types/analytics';

interface TopCategoriesProps {
  data: CategoryBreakdownItem[];
  loading?: boolean;
  currency: string;
}

export default function TopCategories({ data, loading, currency }: TopCategoriesProps) {
  const top = data.slice(0, 8);

  return (
    <ChartCard title="Top Spending Categories" loading={loading} empty={top.length === 0}>
      <div className="space-y-3">
        {top.map((cat, i) => (
          <div key={cat.name} className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-400 w-4">{i + 1}</span>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 truncate">{cat.name}</span>
                <span className="text-sm font-semibold text-gray-900 ml-2">
                  {formatCurrency(cat.amount, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 mr-3">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-16 text-right">
                  {cat.count} txn · {cat.percentage}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

