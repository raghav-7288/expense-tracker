import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  variant?: 'default' | 'success' | 'danger' | 'info';
  subtitle?: string;
}

export default function StatCard({ title, value, icon, trend, variant = 'default', subtitle }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        {
          'bg-white border border-gray-200 shadow-sm': variant === 'default',
          'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/20 shadow-md': variant === 'success',
          'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-500/20 shadow-md': variant === 'danger',
          'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-primary-500/20 shadow-md': variant === 'info',
        },
      )}
    >
      {/* Background decoration */}
      {variant !== 'default' && (
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span
            className={cn('text-xs font-medium uppercase tracking-wider', {
              'text-gray-500': variant === 'default',
              'text-white/80': variant !== 'default',
            })}
          >
            {title}
          </span>
          <div
            className={cn('p-2 rounded-lg', {
              'bg-gray-100 text-gray-600': variant === 'default',
              'bg-white/20 text-white': variant !== 'default',
            })}
          >
            {icon}
          </div>
        </div>
        <p
          className={cn('text-2xl font-bold tracking-tight', {
            'text-gray-900': variant === 'default',
            'text-white': variant !== 'default',
          })}
        >
          {value}
        </p>
        {(trend || subtitle) && (
          <p
            className={cn('text-xs mt-1.5', {
              'text-gray-400': variant === 'default',
              'text-white/70': variant !== 'default',
            })}
          >
            {trend ?? subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
