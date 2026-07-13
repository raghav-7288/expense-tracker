import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  Hash,
  CalendarDays,
  CalendarRange,
  ArrowBigUp,
  ArrowBigDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatCurrency, formatCompactCurrency } from '@/utils/formatCurrency';
import type { AnalyticsSummary } from '@/types/analytics';
import type { ReactNode } from 'react';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  change?: number;
  subtitle?: string;
  variant?: 'default' | 'success' | 'danger' | 'info';
}

function SummaryCard({ title, value, icon, change, subtitle, variant = 'default' }: SummaryCardProps) {
  const hasChange = change !== undefined && change !== 0;
  const isPositive = (change ?? 0) > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow group overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{title}</span>
        <div
          className={cn('p-1.5 rounded-lg transition-colors', {
            'bg-gray-100 text-gray-500 group-hover:bg-gray-200': variant === 'default',
            'bg-green-100 text-green-600 group-hover:bg-green-200': variant === 'success',
            'bg-red-100 text-red-600 group-hover:bg-red-200': variant === 'danger',
            'bg-blue-100 text-blue-600 group-hover:bg-blue-200': variant === 'info',
          })}
        >
          {icon}
        </div>
      </div>
      <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
      <div className="flex items-center gap-1.5 mt-1">
        {hasChange && (
          <span
            className={cn('inline-flex items-center gap-0.5 text-xs font-medium', {
              'text-green-600': isPositive,
              'text-red-600': !isPositive,
            })}
          >
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(change ?? 0)}%
          </span>
        )}
        {!hasChange && change === 0 && (
          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-400">
            <Minus size={12} /> 0%
          </span>
        )}
        {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
      </div>
    </div>
  );
}

interface SummaryGridProps {
  summary: AnalyticsSummary;
  currency: string;
}

export default function SummaryGrid({ summary, currency }: SummaryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      <SummaryCard
        title="Balance"
        value={formatCompactCurrency(summary.currentBalance, currency)}
        icon={<Wallet size={16} />}
        variant="default"
        subtitle="All time"
      />
      <SummaryCard
        title="Income"
        value={formatCompactCurrency(summary.totalIncome, currency)}
        icon={<TrendingUp size={16} />}
        change={summary.incomeChange}
        variant="success"
        subtitle="vs prev"
      />
      <SummaryCard
        title="Expenses"
        value={formatCompactCurrency(summary.totalExpenses, currency)}
        icon={<TrendingDown size={16} />}
        change={summary.expenseChange}
        variant="danger"
        subtitle="vs prev"
      />
      <SummaryCard
        title="Savings"
        value={formatCompactCurrency(summary.savings, currency)}
        icon={<PiggyBank size={16} />}
        change={summary.savingsChange}
        variant={summary.savings >= 0 ? 'success' : 'danger'}
        subtitle="vs prev"
      />
      <SummaryCard
        title="Savings Rate"
        value={`${summary.savingsRate}%`}
        icon={<Percent size={16} />}
        variant={summary.savingsRate >= 20 ? 'success' : summary.savingsRate >= 0 ? 'info' : 'danger'}
        subtitle="of income"
      />
      <SummaryCard
        title="Transactions"
        value={String(summary.transactionCount)}
        icon={<Hash size={16} />}
        change={summary.transactionCountChange}
        variant="info"
        subtitle="vs prev"
      />
      <SummaryCard
        title="Avg Daily"
        value={formatCurrency(summary.avgDailySpending, currency)}
        icon={<CalendarDays size={16} />}
        variant="default"
        subtitle="spending"
      />
      <SummaryCard
        title="Avg Monthly"
        value={formatCompactCurrency(summary.avgMonthlySpending, currency)}
        icon={<CalendarRange size={16} />}
        variant="default"
        subtitle="spending"
      />
      <SummaryCard
        title="Largest Expense"
        value={formatCurrency(summary.highestExpense, currency)}
        icon={<ArrowBigUp size={16} />}
        variant="danger"
        subtitle="single txn"
      />
      <SummaryCard
        title="Largest Income"
        value={formatCurrency(summary.highestIncome, currency)}
        icon={<ArrowBigDown size={16} />}
        variant="success"
        subtitle="single txn"
      />
    </div>
  );
}

