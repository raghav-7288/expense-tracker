import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import ChartCard from '@/components/analytics/ChartCard';
import { formatCompactCurrency } from '@/utils/formatCurrency';
import type { TimeSeriesPoint } from '@/types/analytics';

interface DailySpendingChartProps {
  data: TimeSeriesPoint[];
  loading?: boolean;
  currency: string;
}

export default function DailySpendingChart({ data, loading, currency }: DailySpendingChartProps) {
  const empty = data.every((d) => d.expenses === 0);

  return (
    <ChartCard title="Daily Spending" description="Day-by-day expense tracking" loading={loading} empty={empty}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              formatter={(value) => [formatCompactCurrency(Number(value), currency), 'Spent']}
            />
            <Line type="monotone" dataKey="expenses" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

