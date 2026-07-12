import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMonthlyData } from '@/hooks/useDashboard';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';

export default function MonthlyChart() {
  const { data: monthlyData, isLoading } = useMonthlyData();

  if (isLoading) return <Spinner />;

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4">Monthly Overview</h3>
      {!monthlyData || monthlyData.every((m) => m.income === 0 && m.expenses === 0) ? (
        <div className="h-64 flex items-center justify-center text-sm text-gray-500">
          No data available for this year
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`]}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}


