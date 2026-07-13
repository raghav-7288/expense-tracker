import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5 text-gray-400">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm leading-relaxed">{description}</p>
      {action}
    </div>
  );
}
