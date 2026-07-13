import { Trophy, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import ChartCard from '@/components/analytics/ChartCard';
import { formatCurrency, formatCompactCurrency } from '@/utils/formatCurrency';
import type { YearlyReportData } from '@/types/analytics';

interface YearlyReportProps {
  data: YearlyReportData | null;
  loading?: boolean;
  currency: string;
}

export default function YearlyReport({ data, loading, currency }: YearlyReportProps) {
  if (!data) return null;

  const activeMonths = data.months.filter((m) => m.income > 0 || m.expenses > 0);

  return (
    <ChartCard title={`${data.year} Annual Report`} description="Year-to-date financial summary" loading={loading}>
      <div className="space-y-5">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <TrendingUp size={14} className="mx-auto text-green-600 mb-1" />
            <p className="text-[10px] text-green-600">Income</p>
            <p className="text-xs font-bold text-green-700">{formatCompactCurrency(data.totalIncome, currency)}</p>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <TrendingDown size={14} className="mx-auto text-red-600 mb-1" />
            <p className="text-[10px] text-red-600">Expenses</p>
            <p className="text-xs font-bold text-red-700">{formatCompactCurrency(data.totalExpenses, currency)}</p>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <PiggyBank size={14} className="mx-auto text-blue-600 mb-1" />
            <p className="text-[10px] text-blue-600">Saved</p>
            <p className="text-xs font-bold text-blue-700">{formatCompactCurrency(data.totalSavings, currency)}</p>
          </div>
        </div>

        {/* Monthly chart */}
        {activeMonths.length > 0 && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.months} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="shortMonth" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '11px' }}
                  formatter={(value) => [formatCompactCurrency(Number(value), currency)]}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Highlights */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 py-1.5 border-b border-gray-100">
            <Trophy size={12} className="text-amber-500 flex-shrink-0" />
            <span className="text-gray-500 flex-1">Highest Spending</span>
            <span className="font-medium text-gray-900">{data.highestSpendingMonth}</span>
          </div>
          <div className="flex items-center gap-2 py-1.5 border-b border-gray-100">
            <TrendingUp size={12} className="text-green-500 flex-shrink-0" />
            <span className="text-gray-500 flex-1">Highest Income</span>
            <span className="font-medium text-gray-900">{data.highestIncomeMonth}</span>
          </div>
          <div className="flex items-center gap-2 py-1.5 border-b border-gray-100">
            <PiggyBank size={12} className="text-blue-500 flex-shrink-0" />
            <span className="text-gray-500 flex-1">Best Savings</span>
            <span className="font-medium text-gray-900">{data.bestSavingsMonth}</span>
          </div>
          <div className="flex items-center gap-2 py-1.5">
            <span className="text-gray-500 flex-1 ml-5">Avg Monthly Spending</span>
            <span className="font-medium text-gray-900">{formatCurrency(data.avgMonthlySpending, currency)}</span>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

