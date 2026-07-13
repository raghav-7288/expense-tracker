import { cn } from '@/utils/cn';

interface StatusDotProps {
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Colored dot indicator used in legends, lists, and category markers.
 * Accepts any CSS color value via the `color` prop.
 */
export default function StatusDot({ color, size = 'sm', className }: StatusDotProps) {
  return (
    <div
      className={cn(
        'rounded-full flex-shrink-0',
        {
          'w-2 h-2': size === 'sm',
          'w-2.5 h-2.5': size === 'md',
          'w-3 h-3': size === 'lg',
        },
        className,
      )}
      style={{ backgroundColor: color }}
    />
  );
}

