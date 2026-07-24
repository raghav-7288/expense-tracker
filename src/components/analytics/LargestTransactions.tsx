import { useState } from 'react';
import ChartCard from '@/components/analytics/ChartCard';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import type { TransactionRankingItem } from '@/types/analytics';

interface LargestTransactionsProps {
  largest: TransactionRankingItem[];
  smallest: TransactionRankingItem[];
  loading?: boolean;
  currency: string;
}

export default function LargestTransactions({ largest, smallest, loading, currency }: LargestTransactionsProps) {
  const [tab, setTab] = useState<'largest' | 'smallest'>('largest');
  const data = tab === 'largest' ? largest : smallest;

  return (
    <ChartCard
      title="Transaction Rankings"
      loading={loading}
      empty={data.length === 0}
      action={
        <div className="flex gap-1">
          {(['largest', 'smallest'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                tab === t ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100',
              )}
            >
              {t === 'largest' ? 'Largest' : 'Smallest'}
            </button>
          ))}
        </div>
      }
    >
      <div className="divide-y divide-gray-100">
        {data.slice(0, 8).map((t) => (
          <div key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.categoryColor }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{t.notes}</p>
              <p className="text-xs text-gray-500">
                {t.categoryName} · {formatDate(t.date)}
              </p>
            </div>
            <span
              className={cn('text-sm font-semibold', {
                'text-green-600': t.type === 'income',
                'text-red-600': t.type === 'expense',
              })}
            >
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

