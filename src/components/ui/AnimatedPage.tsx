import { motion } from 'framer-motion';
import { gentle } from '@/utils/animations';
import type { ReactNode } from 'react';

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps page content with a subtle fade-in-up animation.
 * Use at the top level of each page component.
 */
export default function AnimatedPage({ children, className }: AnimatedPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={gentle}
      className={className}
    >
      {children}
    </motion.div>
  );
}

