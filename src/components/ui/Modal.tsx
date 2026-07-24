import { useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (!open) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    // Lock body scroll — works on iOS Safari by fixing position
    scrollYRef.current = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${String(scrollYRef.current)}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.paddingRight = `${String(scrollbarWidth)}px`;
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollYRef.current);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && contentRef.current) {
      contentRef.current.focus();
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content */}
          <motion.div
            ref={contentRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className={cn(
              'modal-content relative w-full bg-white shadow-xl',
              'max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)] sm:max-h-[85vh]',
              'flex flex-col',
              'focus:outline-none',
              'rounded-t-2xl sm:rounded-xl',
              {
                'sm:max-w-sm': size === 'sm',
                'sm:max-w-md': size === 'md',
                'sm:max-w-lg': size === 'lg',
              },
            )}
          >
            {/* Drag indicator for mobile */}
            <div className="sm:hidden flex justify-center pt-2 pb-0 flex-shrink-0">
              <div className="w-9 h-1 rounded-full bg-gray-300" />
            </div>

            <div className="modal-header flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-white z-10 flex-shrink-0 rounded-t-2xl sm:rounded-t-xl">
              <h2 id="modal-title" className="text-base font-semibold text-gray-900">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2.5 -mr-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors touch-manipulation"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 overscroll-contain -webkit-overflow-scrolling-touch pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-5">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
