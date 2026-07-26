import { Link } from 'react-router-dom';
import { useAccountBalances } from '@/hooks/useAccounts';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/utils/cn';
import Card from '@/components/ui/Card';
import { Wallet, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

export default function AccountBalances() {
  const { data: balances, isLoading } = useAccountBalances();
  const currency = useCurrency();

  // Don't show widget if user has no accounts
  if (!isLoading && (!balances || balances.length === 0)) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-full" />
          </div>
        </div>
      </Card>
    );
  }

  const totalNetWorth = balances!.reduce((sum, b) => sum + b.balance, 0);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
            <Wallet size={14} className="text-primary-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Accounts</h3>
        </div>
        <Link
          to="/accounts"
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
        >
          View All <ArrowRight size={12} />
        </Link>
      </div>

      {/* Total */}
      <div className="mb-3 pb-3 border-b border-gray-100">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider">Net Worth</p>
        <p className={cn('text-lg font-bold', totalNetWorth >= 0 ? 'text-gray-900' : 'text-red-600')}>
          {formatCurrency(totalNetWorth, currency)}
        </p>
      </div>

      {/* Account list */}
      <div className="space-y-2.5">
        {balances!.slice(0, 4).map(({ account, balance }) => (
          <div key={account.id} className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${account.color}15` }}
            >
              <Wallet size={12} style={{ color: account.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{account.name}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={cn('text-xs font-semibold tabular-nums', balance >= 0 ? 'text-gray-900' : 'text-red-600')}>
                {formatCurrency(balance, currency)}
              </span>
              {balance >= 0 ? (
                <TrendingUp size={10} className="text-emerald-500" />
              ) : (
                <TrendingDown size={10} className="text-red-500" />
              )}
            </div>
          </div>
        ))}
        {balances!.length > 4 && (
          <p className="text-[11px] text-gray-400 text-center pt-1">
            +{balances!.length - 4} more
          </p>
        )}
      </div>
    </Card>
  );
}

