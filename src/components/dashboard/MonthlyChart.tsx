import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useMonthlyData } from '@/hooks/useDashboard';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';
import { formatCompactCurrency } from '@/utils/formatCurrency';
import { SkeletonChart } from '@/components/ui/Skeleton';
import { TrendingUp } from 'lucide-react';

export default function MonthlyChart() {
  const { data: monthlyData, isLoading } = useMonthlyData();
  const currency = useCurrency();
  const { darkMode } = useTheme();

  if (isLoading) return <SkeletonChart />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Monthly Overview</h3>
          <p className="text-xs text-gray-400 mt-0.5">Income vs expenses this year</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-gray-500">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-[11px] text-gray-500">Expenses</span>
          </div>
        </div>
      </div>
      {!monthlyData || monthlyData.every((m) => m.income === 0 && m.expenses === 0) ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
            <TrendingUp size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">No data yet</p>
          <p className="text-xs text-gray-400 max-w-[200px]">
            Add your first transaction to see monthly trends appear here
          </p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: darkMode ? '#64748b' : '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: darkMode ? '#64748b' : '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '10px',
                  border: darkMode ? '1px solid #344d65' : 'none',
                  backgroundColor: darkMode ? '#243347' : '#fff',
                  boxShadow: darkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  color: darkMode ? '#e2e8f0' : undefined,
                }}
                formatter={(value) => [formatCompactCurrency(Number(value), currency)]}
                cursor={{ fill: darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}
              />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
