import ChartCard from '@/components/analytics/ChartCard';
import { formatCurrency } from '@/utils/formatCurrency';
import type { CategoryBreakdownItem } from '@/types/analytics';

interface CategoryBreakdownTableProps {
  data: CategoryBreakdownItem[];
  loading?: boolean;
  currency: string;
}

export default function CategoryBreakdownTable({ data, loading, currency }: CategoryBreakdownTableProps) {
  return (
    <ChartCard
      title="Category Breakdown"
      description="Detailed analysis per category"
      loading={loading}
      empty={data.length === 0}
    >
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 font-medium text-gray-500">Category</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500">Total</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500 hidden sm:table-cell">%</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500 hidden md:table-cell">Avg</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500 hidden md:table-cell">Count</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500 hidden lg:table-cell">Highest</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500 hidden lg:table-cell">Lowest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((cat) => (
              <tr key={cat.name} className="hover:bg-gray-50 transition-colors">
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium text-gray-900 truncate max-w-[120px]">{cat.name}</span>
                  </div>
                </td>
                <td className="py-2.5 px-2 text-right font-semibold text-gray-900">
                  {formatCurrency(cat.amount, currency)}
                </td>
                <td className="py-2.5 px-2 text-right text-gray-600 hidden sm:table-cell">
                  {cat.percentage}%
                </td>
                <td className="py-2.5 px-2 text-right text-gray-600 hidden md:table-cell">
                  {formatCurrency(cat.avgTransaction, currency)}
                </td>
                <td className="py-2.5 px-2 text-right text-gray-600 hidden md:table-cell">
                  {cat.count}
                </td>
                <td className="py-2.5 px-2 text-right text-gray-600 hidden lg:table-cell">
                  {formatCurrency(cat.highestTransaction, currency)}
                </td>
                <td className="py-2.5 px-2 text-right text-gray-600 hidden lg:table-cell">
                  {formatCurrency(cat.lowestTransaction, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

