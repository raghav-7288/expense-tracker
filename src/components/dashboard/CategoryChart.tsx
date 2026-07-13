import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useCategoryBreakdown } from '@/hooks/useDashboard';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { SkeletonPieChart } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/formatCurrency';
import { PieChart as PieChartIcon } from 'lucide-react';

export default function CategoryChart() {
  const { data: breakdown, isLoading } = useCategoryBreakdown();
  const currency = useCurrency();
  const { darkMode } = useTheme();

  if (isLoading) return <SkeletonPieChart />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Expenses by Category</h3>
        <p className="text-xs text-gray-400 mt-0.5">This month's breakdown</p>
      </div>
      {!breakdown || breakdown.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
            <PieChartIcon size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">No expenses yet</p>
          <p className="text-xs text-gray-400 max-w-[180px]">
            Track an expense to see your category breakdown
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="h-40 w-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={68}
                  dataKey="amount"
                  nameKey="name"
                  strokeWidth={2}
                  stroke={darkMode ? '#1e293b' : '#fff'}
                >
                  {breakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value), currency)]}
                  contentStyle={{
                    borderRadius: '10px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full space-y-2.5">
            {breakdown.slice(0, 5).map((item) => (
              <div key={item.name} className="flex items-center gap-2.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-600 flex-1 truncate">{item.name}</span>
                <span className="text-xs font-semibold text-gray-900 tabular-nums">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
