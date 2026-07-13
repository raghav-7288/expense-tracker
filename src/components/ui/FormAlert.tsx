import { cn } from '@/utils/cn';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { ReactNode } from 'react';

interface FormAlertProps {
  type?: 'error' | 'success' | 'info';
  message: ReactNode;
  className?: string;
}

/**
 * Inline alert banner for form-level messages (errors, success, info).
 * Used inside forms for server-side validation errors and success feedback.
 */
export default function FormAlert({ type = 'error', message, className }: FormAlertProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 px-3.5 py-3 rounded-lg text-sm',
        {
          'bg-red-50 text-red-700 border border-red-100': type === 'error',
          'bg-green-50 text-green-700 border border-green-100': type === 'success',
          'bg-blue-50 text-blue-700 border border-blue-100': type === 'info',
        },
        className,
      )}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {type === 'error' && <AlertCircle size={15} />}
        {type === 'success' && <CheckCircle2 size={15} />}
        {type === 'info' && <Info size={15} />}
      </div>
      <p className="text-[13px] leading-snug">{message}</p>
    </div>
  );
}

