import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import Spinner from '@/components/ui/Spinner';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
  action?: ReactNode;
}

export default function ChartCard({
  title,
  description,
  children,
  loading,
  empty,
  emptyMessage = 'No data available',
  className,
  action,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col',
        className,
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <Spinner size={20} />
        </div>
      ) : empty ? (
        <div className="flex-1 flex items-center justify-center min-h-[200px] text-sm text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="flex-1">{children}</div>
      )}
    </div>
  );
}

