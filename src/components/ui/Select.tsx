import { cn } from '@/utils/cn';
import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export default function Select({
  label,
  error,
  options,
  placeholder,
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'block w-full appearance-none rounded-lg border px-3 py-2 pr-9 text-sm transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-200',
            error
              ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-200 hover:border-gray-300',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <ChevronDown size={14} />
        </div>
      </div>
      {error && (
        <p id={`${selectId}-error`} className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
            <circle cx="6" cy="6" r="6" fill="currentColor" opacity="0.15" />
            <path d="M6 3.5V6.5M6 8.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
