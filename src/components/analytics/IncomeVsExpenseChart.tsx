import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import ChartCard from '@/components/analytics/ChartCard';
import { formatCompactCurrency } from '@/utils/formatCurrency';
import type { TimeSeriesPoint } from '@/types/analytics';

interface IncomeVsExpenseChartProps {
  data: TimeSeriesPoint[];
  loading?: boolean;
  currency: string;
}

export default function IncomeVsExpenseChart({ data, loading, currency }: IncomeVsExpenseChartProps) {
  const empty = data.length === 0 || data.every((d) => d.income === 0 && d.expenses === 0);

  return (
    <ChartCard title="Income vs Expenses" description="Trend comparison over time" loading={loading} empty={empty}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              formatter={(value) => [formatCompactCurrency(Number(value), currency)]}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

