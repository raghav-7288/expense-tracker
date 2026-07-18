import { AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { ReactNode } from 'react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  retry?: () => void;
}

export default function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  icon,
  retry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5 text-red-400">
        {icon ?? <AlertCircle size={28} />}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm leading-relaxed">{description}</p>
      {retry && (
        <Button onClick={retry} variant="secondary" size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
}
