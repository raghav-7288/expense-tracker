import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export default function Dropdown({ trigger, children, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[180px] bg-white rounded-lg border border-gray-200 shadow-lg py-1',
            'animate-in fade-in-0 zoom-in-95',
            {
              'left-0': align === 'left',
              'right-0': align === 'right',
            },
          )}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  icon?: ReactNode;
}

export function DropdownItem({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  icon,
}: DropdownItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      role="menuitem"
      className={cn(
        'flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'text-gray-700 hover:bg-gray-50': variant === 'default',
          'text-red-600 hover:bg-red-50': variant === 'danger',
        },
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

