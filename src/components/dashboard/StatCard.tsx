import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  variant?: 'default' | 'success' | 'danger';
}

export default function StatCard({ title, value, icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div
          className={cn(
            'p-2 rounded-lg',
            {
              'bg-gray-100 text-gray-600': variant === 'default',
              'bg-green-100 text-green-600': variant === 'success',
              'bg-red-100 text-red-600': variant === 'danger',
            },
          )}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {trend && (
        <p className="text-xs text-gray-500 mt-1">{trend}</p>
      )}
    </div>
  );
}

