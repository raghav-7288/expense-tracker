import { cn } from '@/utils/cn';
import type { TransactionType } from '@/types';

interface BadgeProps {
  type: TransactionType;
  className?: string;
}

export default function Badge({ type, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
        type === 'income'
          ? 'bg-green-50 text-green-700'
          : 'bg-red-50 text-red-700',
        className,
      )}
    >
      {type === 'income' ? 'Income' : 'Expense'}
    </span>
  );
}
