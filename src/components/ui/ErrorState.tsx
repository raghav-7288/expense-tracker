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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-gray-300 mb-4">
        {icon ?? <AlertCircle size={40} />}
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">{description}</p>
      {retry && (
        <Button onClick={retry} variant="secondary" size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
}
