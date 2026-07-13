import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useMonthlyData } from '@/hooks/useDashboard';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCompactCurrency } from '@/utils/formatCurrency';
import { SkeletonChart } from '@/components/ui/Skeleton';
import { TrendingUp } from 'lucide-react';

export default function MonthlyChart() {
  const { data: monthlyData, isLoading } = useMonthlyData();
  const currency = useCurrency();

  if (isLoading) return <SkeletonChart />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
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
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '10px',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
                formatter={(value) => [formatCompactCurrency(Number(value), currency)]}
                cursor={{ fill: '#f8fafc' }}
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
