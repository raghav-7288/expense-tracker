import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useBudgetProgress } from '@/hooks/useBudgets';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/utils/cn';
import { Target, ArrowRight } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/Skeleton';

function BudgetProgressWidget() {
  const { data: progress, isLoading } = useBudgetProgress();
  const currency = useCurrency();

  if (isLoading) return <SkeletonCard />;

  if (!progress || progress.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
            <Target size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">No budgets set</p>
          <p className="text-xs text-gray-400 max-w-[200px] mb-3">
            Set spending limits for your categories to track your budget
          </p>
          <Link
            to="/budgets"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            Set up a budget <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    );
  }

  // Show top 5 budgets sorted by percentage (most critical first)
  const sorted = [...progress].sort((a, b) => b.percentage - a.percentage).slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Budget Progress</h3>
          <p className="text-xs text-gray-400 mt-0.5">Current period spending</p>
        </div>
        <Link
          to="/budgets"
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
        >
          Manage <ArrowRight size={12} />
        </Link>
      </div>

      <div className="space-y-3.5">
        {sorted.map((item) => {
          const categoryName = item.budget.category?.name ?? 'Unknown';
          const categoryColor = item.budget.category?.color ?? '#6b7280';
          const pct = Math.min(item.percentage, 100);

          return (
            <div key={item.budget.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: categoryColor }}
                  />
                  <span className="text-xs font-medium text-gray-700 truncate">
                    {categoryName}
                  </span>
                </div>
                <span className="text-xs tabular-nums text-gray-500 flex-shrink-0 ml-2">
                  {formatCurrency(item.spent, currency)} / {formatCurrency(item.budget.amount, currency)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    item.status === 'exceeded' && 'bg-red-500',
                    item.status === 'warning' && 'bg-amber-500',
                    item.status === 'on_track' && 'bg-emerald-500',
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {item.status === 'exceeded' && (
                <p className="text-[10px] text-red-500 mt-0.5 font-medium">
                  Over by {formatCurrency(item.spent - item.budget.amount, currency)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(BudgetProgressWidget);

