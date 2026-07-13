import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { BarChart2 } from 'lucide-react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  className?: string;
  action?: ReactNode;
}

export default function ChartCard({
  title,
  description,
  children,
  loading,
  empty,
  emptyMessage = 'No data available yet',
  emptyIcon,
  emptyAction,
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
        <div className="flex-1 min-h-[200px] animate-pulse">
          <div className="h-full flex items-end gap-1.5 pt-8">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="flex-1 bg-gray-100 rounded-t"
                style={{ height: `${25 + ((i * 13 + 7) % 50)}%` }}
              />
            ))}
          </div>
        </div>
      ) : empty ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] text-center px-4">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3 text-gray-300">
            {emptyIcon ?? <BarChart2 size={18} />}
          </div>
          <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
            {emptyMessage}
          </p>
          {emptyAction && <div className="mt-3">{emptyAction}</div>}
        </div>
      ) : (
        <div className="flex-1">{children}</div>
      )}
    </div>
  );
}
