import { cn } from '@/utils/cn';
import type { TransactionType } from '@/types';

interface BadgeProps {
  type: TransactionType;
  className?: string;
}

const badgeStyles: Record<TransactionType, string> = {
  income: 'bg-green-50 text-green-700',
  expense: 'bg-red-50 text-red-700',
  lent: 'bg-blue-50 text-blue-700',
  borrowed: 'bg-amber-50 text-amber-700',
};

const badgeLabels: Record<TransactionType, string> = {
  income: 'Income',
  expense: 'Expense',
  lent: 'Lent',
  borrowed: 'Borrowed',
};

export default function Badge({ type, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
        badgeStyles[type],
        className,
      )}
    >
      {badgeLabels[type]}
    </span>
  );
}
