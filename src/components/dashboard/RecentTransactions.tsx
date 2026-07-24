import { Link } from 'react-router-dom';
import { useRecentTransactions } from '@/hooks/useDashboard';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateShort } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { SkeletonRecentTransactions } from '@/components/ui/Skeleton';
import { ArrowRight, Receipt } from 'lucide-react';

export default function RecentTransactions() {
  const { data: transactions, isLoading } = useRecentTransactions(5);
  const currency = useCurrency();

  if (isLoading) return <SkeletonRecentTransactions />;

  return (
    <Card padding={false}>
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Recent Transactions</h3>
        <Link
          to="/transactions"
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {!transactions || transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
          <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
            <Receipt size={18} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">No activity yet</p>
          <p className="text-xs text-gray-400 mb-4 max-w-[200px]">
            Your recent transactions will appear here once you start tracking
          </p>
          <Link
            to="/transactions"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Add your first transaction →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-gray-50/50 transition-colors gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={t.notes} color={t.categories?.color ?? '#6b7280'} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.notes}</p>
                  <p className="text-[11px] text-gray-400">{formatDateShort(t.date)}</p>
                </div>
              </div>
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums flex-shrink-0',
                  t.type === 'income' ? 'text-emerald-600' : 'text-red-600',
                )}
              >
                {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount), currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

