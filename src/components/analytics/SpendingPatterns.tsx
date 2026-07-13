import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import ChartCard from '@/components/analytics/ChartCard';
import { formatCurrency } from '@/utils/formatCurrency';
import type { SpendingPatternData } from '@/types/analytics';

interface SpendingPatternsProps {
  data: SpendingPatternData | null;
  loading?: boolean;
  currency: string;
}

export default function SpendingPatterns({ data, loading, currency }: SpendingPatternsProps) {
  if (!data) return null;

  const weekdayPct =
    data.weekdayTotal + data.weekendTotal > 0
      ? Math.round((data.weekdayTotal / (data.weekdayTotal + data.weekendTotal)) * 100)
      : 0;
  const weekendPct = 100 - weekdayPct;

  return (
    <ChartCard title="Spending Patterns" description="When do you spend the most?" loading={loading}>
      <div className="space-y-5">
        {/* Weekday vs Weekend */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Weekday vs Weekend</h4>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden flex">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${weekdayPct}%` }}
              />
              <div
                className="h-full bg-orange-400 transition-all"
                style={{ width: `${weekendPct}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />
              Weekday {weekdayPct}% · {formatCurrency(data.weekdayTotal, currency)}
            </span>
            <span className="text-gray-500">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1" />
              Weekend {weekendPct}% · {formatCurrency(data.weekendTotal, currency)}
            </span>
          </div>
        </div>

        {/* By day of week */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">By Day of Week</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byDayOfWeek} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="shortDay" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '11px' }}
                  formatter={(value) => [formatCurrency(Number(value), currency), 'Total']}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Busiest Day</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{data.busiestDay}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Quietest Day</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{data.quietestDay}</p>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

