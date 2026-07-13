import { cn } from '@/utils/cn';
import type { TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function TextArea({ label, error, className, id, ...props }: TextAreaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'block w-full rounded-lg border px-3 py-2 text-sm transition-all duration-150 resize-none',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
          error
            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
            : 'border-gray-200 hover:border-gray-300',
          className,
        )}
        rows={3}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
