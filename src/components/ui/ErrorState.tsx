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
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-red-400 mb-4">
        {icon ?? <AlertCircle size={48} />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">{description}</p>
      {retry && (
        <Button onClick={retry} variant="secondary">
          Try Again
        </Button>
      )}
    </div>
  );
}

