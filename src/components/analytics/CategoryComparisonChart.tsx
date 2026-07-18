import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import ChartCard from '@/components/analytics/ChartCard';
import { formatCompactCurrency } from '@/utils/formatCurrency';
import type { CategoryBreakdownItem } from '@/types/analytics';

interface CategoryComparisonChartProps {
  data: CategoryBreakdownItem[];
  loading?: boolean;
  currency: string;
}

export default function CategoryComparisonChart({ data, loading, currency }: CategoryComparisonChartProps) {
  const top = data.slice(0, 8);

  return (
    <ChartCard title="Category Comparison" description="Top categories by amount" loading={loading} empty={top.length === 0}>
      <div className="h-56 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} layout="vertical" margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              formatter={(value) => [formatCompactCurrency(Number(value), currency), 'Amount']}
            />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
              {top.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

