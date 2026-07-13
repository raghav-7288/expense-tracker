import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import ChartCard from '@/components/analytics/ChartCard';
import { formatCompactCurrency } from '@/utils/formatCurrency';
import type { TimeSeriesPoint } from '@/types/analytics';

interface SavingsTrendChartProps {
  data: TimeSeriesPoint[];
  loading?: boolean;
  currency: string;
}

export default function SavingsTrendChart({ data, loading, currency }: SavingsTrendChartProps) {
  const empty = data.every((d) => d.net === 0);

  return (
    <ChartCard title="Savings Trend" description="Cumulative savings over time" loading={loading} empty={empty}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              formatter={(value) => [formatCompactCurrency(Number(value), currency), 'Cumulative']}
            />
            <Area type="monotone" dataKey="net" stroke="#10b981" strokeWidth={2} fill="url(#savingsGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

