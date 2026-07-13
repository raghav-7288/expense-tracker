import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import ChartCard from '@/components/analytics/ChartCard';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTheme } from '@/hooks/useTheme';
import type { CategoryBreakdownItem } from '@/types/analytics';

interface CategoryPieChartProps {
  data: CategoryBreakdownItem[];
  type: 'expense' | 'income';
  loading?: boolean;
  currency: string;
}

export default function CategoryPieChart({ data, type, loading, currency }: CategoryPieChartProps) {
  const { darkMode } = useTheme();
  const title = type === 'expense' ? 'Spending by Category' : 'Income by Category';
  const emptyMessage = type === 'expense' ? 'No expense data' : 'No income data';

  return (
    <ChartCard title={title} loading={loading} empty={data.length === 0} emptyMessage={emptyMessage}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-44 w-44 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="amount"
                nameKey="name"
                strokeWidth={2}
                stroke={darkMode ? '#1e293b' : '#fff'}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                formatter={(value) => [formatCurrency(Number(value), currency)]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full space-y-1.5">
          {data.slice(0, 6).map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-gray-600 flex-1 truncate">{item.name}</span>
              <span className="font-medium text-gray-900">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

