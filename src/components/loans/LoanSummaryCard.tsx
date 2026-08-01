import { Link } from 'react-router-dom';
import { useLoanSummary } from '@/hooks/useLoans';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/utils/cn';
import Card from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ArrowRight, HandCoins, ArrowDownLeft, Scale } from 'lucide-react';

export default function LoanSummaryCard() {
  const { data: summary, isLoading } = useLoanSummary();
  const currency = useCurrency();

  if (isLoading) return <SkeletonCard />;

  // Don't render if user has no loans
  if (!summary || (summary.activeLoansCount === 0 && summary.settledLoansCount === 0)) {
    return null;
  }

  return (
    <Card padding={false}>
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Loan Summary</h3>
        <Link
          to="/loans"
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        {/* Lent */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <HandCoins size={15} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">To receive</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(summary.outstandingLent, currency)}</p>
            </div>
          </div>
        </div>

        {/* Borrowed */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <ArrowDownLeft size={15} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">To pay back</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(summary.outstandingBorrowed, currency)}</p>
            </div>
          </div>
        </div>

        {/* Net */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                <Scale size={15} className="text-gray-600" />
              </div>
              <p className="text-xs text-gray-500">Net position</p>
            </div>
            <span
              className={cn(
                'text-sm font-bold',
                summary.netReceivable > 0 ? 'text-emerald-600' : summary.netReceivable < 0 ? 'text-red-600' : 'text-gray-600',
              )}
            >
              {summary.netReceivable >= 0 ? '+' : ''}{formatCurrency(summary.netReceivable, currency)}
            </span>
          </div>
        </div>

        {/* Active count */}
        <p className="text-[11px] text-gray-400 pt-1">
          {summary.activeLoansCount} active · {summary.settledLoansCount} settled
        </p>
      </div>
    </Card>
  );
}

