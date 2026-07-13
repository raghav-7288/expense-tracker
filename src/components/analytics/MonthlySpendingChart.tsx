import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import ChartCard from '@/components/analytics/ChartCard';
import { formatCompactCurrency } from '@/utils/formatCurrency';
import type { TimeSeriesPoint } from '@/types/analytics';

interface MonthlySpendingChartProps {
  data: TimeSeriesPoint[];
  loading?: boolean;
  currency: string;
}

export default function MonthlySpendingChart({ data, loading, currency }: MonthlySpendingChartProps) {
  const empty = data.every((d) => d.income === 0 && d.expenses === 0);

  return (
    <ChartCard title="Monthly Spending" description="Income and expenses by month" loading={loading} empty={empty}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              formatter={(value) => [formatCompactCurrency(Number(value), currency)]}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

