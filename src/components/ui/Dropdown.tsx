import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';
import type { ReactNode, KeyboardEvent as ReactKeyboardEvent } from 'react';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
  label?: string;
}

export default function Dropdown({ trigger, children, align = 'right', className, label }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(e: globalThis.KeyboardEvent) {
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

  // Focus first menu item when opened
  useEffect(() => {
    if (open && menuRef.current) {
      const firstItem = menuRef.current.querySelector<HTMLButtonElement>('[role="menuitem"]');
      firstItem?.focus();
    }
  }, [open]);

  const handleKeyDown = useCallback((e: ReactKeyboardEvent) => {
    if (!open || !menuRef.current) return;
    const items = Array.from(menuRef.current.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'));
    const current = document.activeElement as HTMLButtonElement;
    const idx = items.indexOf(current);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(idx + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  }, [open]);

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className="inline-flex"
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={menuRef}
          className={cn(
            'absolute z-50 mt-1 min-w-[180px] bg-white rounded-lg border border-gray-200 shadow-lg py-1',
            {
              'left-0': align === 'left',
              'right-0': align === 'right',
            },
          )}
          role="menu"
          aria-label={label}
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
      tabIndex={-1}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:bg-gray-50',
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
