import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-gray-200',
            {
              'h-4 rounded': variant === 'text',
              'rounded-full': variant === 'circular',
              'rounded-lg': variant === 'rectangular',
            },
            className,
          )}
          style={{ width: width ?? '100%', height: height ?? undefined }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100 animate-pulse">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
          <div className="h-5 w-16 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

