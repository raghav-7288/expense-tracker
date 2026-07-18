import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import ChartCard from '@/components/analytics/ChartCard';
import { formatCompactCurrency } from '@/utils/formatCurrency';
import type { TimeSeriesPoint } from '@/types/analytics';

interface CashFlowChartProps {
  data: TimeSeriesPoint[];
  loading?: boolean;
  currency: string;
}

export default function CashFlowChart({ data, loading, currency }: CashFlowChartProps) {
  const empty = data.every((d) => d.net === 0);

  return (
    <ChartCard title="Cash Flow" description="Net income over time" loading={loading} empty={empty}>
      <div className="h-52 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -5, bottom: 0 }}>
            <defs>
              <linearGradient id="cashFlowPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              formatter={(value) => [formatCompactCurrency(Number(value), currency), 'Net']}
            />
            <Area type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} fill="url(#cashFlowPos)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

