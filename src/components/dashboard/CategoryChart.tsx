import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useCategoryBreakdown } from '@/hooks/useDashboard';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { formatCurrency } from '@/utils/formatCurrency';

export default function CategoryChart() {
  const { data: breakdown, isLoading } = useCategoryBreakdown();

  if (isLoading) return <Spinner />;

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4">Expenses by Category</h3>
      {!breakdown || breakdown.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-gray-500">
          No expense data this month
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="h-48 w-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  dataKey="amount"
                  nameKey="name"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {breakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value))]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 w-full space-y-2">
            {breakdown.slice(0, 5).map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600 flex-1 truncate">{item.name}</span>
                <span className="text-sm font-medium text-gray-900">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}


