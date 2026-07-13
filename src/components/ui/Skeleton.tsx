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
            'animate-pulse bg-gray-200/70',
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

/** Stat card skeleton — matches StatCard layout */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 bg-gray-200/70 rounded w-20" />
        <div className="w-8 h-8 rounded-lg bg-gray-200/70" />
      </div>
      <div className="h-6 bg-gray-200/70 rounded w-28 mb-2" />
      <div className="h-3 bg-gray-200/70 rounded w-16" />
    </div>
  );
}

/** Transaction table skeleton — matches TransactionList desktop table */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-pulse">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 flex gap-4">
        <div className="h-3 bg-gray-200/70 rounded w-24" />
        <div className="h-3 bg-gray-200/70 rounded w-16 hidden sm:block" />
        <div className="h-3 bg-gray-200/70 rounded w-14 hidden md:block" />
        <div className="h-3 bg-gray-200/70 rounded w-12 hidden md:block" />
        <div className="flex-1" />
        <div className="h-3 bg-gray-200/70 rounded w-16" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
          <div className="w-9 h-9 rounded-full bg-gray-200/70 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-200/70 rounded w-2/5" />
            <div className="h-2.5 bg-gray-100 rounded w-1/4" />
          </div>
          <div className="h-4 w-20 bg-gray-200/70 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Chart skeleton — matches MonthlyChart / ChartCard layout */
export function SkeletonChart() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div className="space-y-1.5">
          <div className="h-3.5 bg-gray-200/70 rounded w-28" />
          <div className="h-2.5 bg-gray-100 rounded w-40" />
        </div>
        <div className="flex gap-3">
          <div className="h-3 bg-gray-200/70 rounded w-12" />
          <div className="h-3 bg-gray-200/70 rounded w-12" />
        </div>
      </div>
      <div className="h-64 flex items-end gap-2 pt-8">
        {[35, 55, 45, 70, 50, 65, 40, 75, 55, 30, 60, 45].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-100 rounded-t"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Category pie chart skeleton */
export function SkeletonPieChart() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 animate-pulse">
      <div className="space-y-1.5 mb-4">
        <div className="h-3.5 bg-gray-200/70 rounded w-32" />
        <div className="h-2.5 bg-gray-100 rounded w-28" />
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="w-36 h-36 rounded-full border-[12px] border-gray-200/70 bg-white" />
        <div className="w-full space-y-2.5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-200/70" />
              <div className="h-3 bg-gray-100 rounded flex-1" />
              <div className="h-3 bg-gray-200/70 rounded w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Profile page skeleton */
export function SkeletonProfile() {
  return (
    <div className="space-y-6 max-w-2xl animate-pulse">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="h-6 bg-gray-200/70 rounded w-24" />
        <div className="h-3.5 bg-gray-100 rounded w-44" />
      </div>
      {/* Profile card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200/70" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200/70 rounded w-28" />
            <div className="h-3 bg-gray-100 rounded w-40" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-200/70 rounded w-16" />
            <div className="h-9 bg-gray-100 rounded-lg w-full" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-200/70 rounded w-14" />
            <div className="h-9 bg-gray-100 rounded-lg w-full" />
          </div>
          <div className="h-9 bg-gray-200/70 rounded-lg w-28" />
        </div>
      </div>
      {/* Appearance card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="h-4 bg-gray-200/70 rounded w-24 mb-4" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-gray-200/70" />
            <div className="space-y-1.5">
              <div className="h-3.5 bg-gray-200/70 rounded w-20" />
              <div className="h-2.5 bg-gray-100 rounded w-28" />
            </div>
          </div>
          <div className="w-12 h-6 rounded-full bg-gray-200/70" />
        </div>
      </div>
      {/* Password card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <div className="h-4 bg-gray-200/70 rounded w-32" />
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-200/70 rounded w-24" />
          <div className="h-9 bg-gray-100 rounded-lg w-full" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-200/70 rounded w-36" />
          <div className="h-9 bg-gray-100 rounded-lg w-full" />
        </div>
        <div className="h-9 bg-gray-200/70 rounded-lg w-32" />
      </div>
    </div>
  );
}

/** Category grid skeleton */
export function SkeletonCategoryGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200/70 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-200/70 rounded w-20" />
            <div className="h-2.5 bg-gray-100 rounded w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Recent transactions skeleton (dashboard) */
export function SkeletonRecentTransactions() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm animate-pulse">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="h-3.5 bg-gray-200/70 rounded w-32" />
        <div className="h-3 bg-gray-100 rounded w-14" />
      </div>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200/70" />
            <div className="space-y-1.5">
              <div className="h-3.5 bg-gray-200/70 rounded w-24" />
              <div className="h-2.5 bg-gray-100 rounded w-14" />
            </div>
          </div>
          <div className="h-4 bg-gray-200/70 rounded w-16" />
        </div>
      ))}
    </div>
  );
}
