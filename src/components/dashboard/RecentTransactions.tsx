import { Link } from 'react-router-dom';
import { useRecentTransactions } from '@/hooks/useDashboard';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { ArrowRight } from 'lucide-react';

export default function RecentTransactions() {
  const { data: transactions, isLoading } = useRecentTransactions(5);

  if (isLoading) return <Spinner />;

  return (
    <Card padding={false}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
        <Link
          to="/transactions"
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {!transactions || transactions.length === 0 ? (
        <div className="p-6 text-center text-sm text-gray-500">
          No transactions yet. Start by adding one!
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: t.categories?.color ?? '#6b7280' }}
                >
                  <span className="text-white text-xs font-medium">
                    {t.description.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(t.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge type={t.type} />
                <span
                  className={`text-sm font-semibold ${
                    t.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

