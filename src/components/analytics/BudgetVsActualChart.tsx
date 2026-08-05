import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useBudgetProgress } from '@/hooks/useBudgets';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTheme } from '@/hooks/useTheme';
import { Target } from 'lucide-react';
import { Link } from 'react-router-dom';

function BudgetVsActualChart() {
  const { data: progress, isLoading } = useBudgetProgress();
  const currency = useCurrency();
  const { darkMode } = useTheme();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 animate-pulse">
        <div className="h-4 bg-gray-200/70 rounded w-32 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-48 mb-6" />
        <div className="h-48 bg-gray-50 rounded" />
      </div>
    );
  }

  if (!progress || progress.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Budget vs. Actual</h3>
        <p className="text-xs text-gray-400 mb-4">Compare budgeted amounts to actual spending</p>
        <div className="h-48 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center mb-2">
            <Target size={18} className="text-gray-300" />
          </div>
          <p className="text-xs text-gray-500 mb-1">No budgets configured</p>
          <Link
            to="/budgets"
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Set up budgets →
          </Link>
        </div>
      </div>
    );
  }

  const chartData = progress.map((item) => ({
    name: item.budget.category?.name ?? 'Unknown',
    budgeted: item.budget.amount,
    actual: item.spent,
    color: item.budget.category?.color ?? '#6b7280',
    status: item.status,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Budget vs. Actual</h3>
      <p className="text-xs text-gray-400 mb-4">Compare budgeted amounts to actual spending this period</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#f1f5f9'} horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => formatCurrency(v, currency)}
              tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#374151' }}
              width={90}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value), currency),
                name === 'budgeted' ? 'Budget' : 'Actual',
              ]}
              contentStyle={{
                borderRadius: '10px',
                border: darkMode ? '1px solid #344d65' : 'none',
                backgroundColor: darkMode ? '#243347' : '#fff',
                boxShadow: darkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)',
                fontSize: '12px',
                color: darkMode ? '#e2e8f0' : undefined,
              }}
            />
            <Bar dataKey="budgeted" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={12} name="budgeted" />
            <Bar dataKey="actual" radius={[0, 4, 4, 0]} barSize={12} name="actual">
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.status === 'exceeded' ? '#ef4444' :
                    entry.status === 'warning' ? '#f59e0b' :
                    '#10b981'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-gray-200" />
          <span className="text-[10px] text-gray-500">Budget</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span className="text-[10px] text-gray-500">On track</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
          <span className="text-[10px] text-gray-500">Warning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
          <span className="text-[10px] text-gray-500">Exceeded</span>
        </div>
      </div>
    </div>
  );
}

export default memo(BudgetVsActualChart);


