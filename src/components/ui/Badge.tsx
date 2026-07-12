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
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        type === 'income'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800',
        className,
      )}
    >
      {type === 'income' ? 'Income' : 'Expense'}
    </span>
  );
}

