import { cn } from '@/utils/cn';

interface AvatarProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Circular avatar with a single letter initial and background color.
 * Used in transaction lists, category cards, and recent transactions.
 */
export default function Avatar({ name, color = '#6b7280', size = 'md', className }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0',
        {
          'w-7 h-7': size === 'sm',
          'w-9 h-9': size === 'md',
          'w-11 h-11': size === 'lg',
        },
        className,
      )}
      style={{ backgroundColor: color }}
    >
      <span
        className={cn('text-white font-semibold', {
          'text-[9px]': size === 'sm',
          'text-xs': size === 'md',
          'text-sm': size === 'lg',
        })}
      >
        {initial}
      </span>
    </div>
  );
}

