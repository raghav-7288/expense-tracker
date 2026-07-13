import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';
import ChartCard from '@/components/analytics/ChartCard';
import { formatCurrency } from '@/utils/formatCurrency';
import type { MonthlyReportData } from '@/types/analytics';

interface MonthlyReportProps {
  data: MonthlyReportData | null;
  loading?: boolean;
  currency: string;
}

function ChangeIndicator({ value, inverted }: { value: number; inverted?: boolean }) {
  if (value === 0) return <Minus size={12} className="text-gray-400" />;
  const isUp = value > 0;
  const isGood = inverted ? !isUp : isUp;
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', isGood ? 'text-green-600' : 'text-red-600')}>
      {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(value)}%
    </span>
  );
}

export default function MonthlyReport({ data, loading, currency }: MonthlyReportProps) {
  if (!data) return null;

  return (
    <ChartCard title="Monthly Report" description={data.monthLabel} loading={loading}>
      <div className="space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-green-600">Income</p>
            <p className="text-sm font-bold text-green-700">{formatCurrency(data.totalIncome, currency)}</p>
            <ChangeIndicator value={data.incomeChange} />
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-xs text-red-600">Expenses</p>
            <p className="text-sm font-bold text-red-700">{formatCurrency(data.totalExpenses, currency)}</p>
            <ChangeIndicator value={data.expenseChange} inverted />
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-600">Savings</p>
            <p className="text-sm font-bold text-blue-700">{formatCurrency(data.savings, currency)}</p>
            <ChangeIndicator value={data.savingsChange} />
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs text-purple-600">Savings Rate</p>
            <p className="text-sm font-bold text-purple-700">{data.savingsRate}%</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Biggest Category</span>
            <span className="font-medium text-gray-900">{data.biggestCategory}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Most Expensive Day</span>
            <span className="font-medium text-gray-900">{data.mostExpensiveDay}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Avg Transaction</span>
            <span className="font-medium text-gray-900">{formatCurrency(data.avgTransaction, currency)}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-gray-500">Transactions</span>
            <span className="font-medium text-gray-900">{data.transactionCount}</span>
          </div>
        </div>

        {/* Comparison */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 leading-relaxed">{data.comparisonText}</p>
        </div>
      </div>
    </ChartCard>
  );
}

