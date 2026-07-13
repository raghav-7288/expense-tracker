/**
 * Shared animation variants and transition presets for Framer Motion.
 * Import these to keep animations consistent across the app.
 */
import type { Variants, Transition } from 'framer-motion';

/* ─── TRANSITIONS ─── */

export const spring: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
};

export const snappy: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

export const gentle: Transition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1],
};

export const slow: Transition = {
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1],
};

/* ─── VARIANTS ─── */

/** Fade in from below (for page content, cards) */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

/** Simple fade */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

/** Scale in from slightly smaller (for modals, dropdowns) */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

/** Slide in from left (for sidebar) */
export const slideInLeft: Variants = {
  hidden: { x: '-100%' },
  visible: { x: 0 },
};

/** Stagger children container */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

/** Stagger item (used inside staggerContainer) */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

/** List item (for transaction rows, category cards) */
export const listItem: Variants = {
  hidden: { opacity: 0, x: -4 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 4, transition: { duration: 0.15 } },
};

