/**
 * Design System Tokens
 * ────────────────────
 * Single source of truth for all design decisions.
 * Import these values when you need programmatic access to tokens.
 * For Tailwind classes, reference the token names in comments.
 *
 * USAGE: These tokens document the system. Components use Tailwind classes directly.
 * This file serves as documentation + programmatic reference for JS-based styling (charts, etc.)
 */

/* ─── COLORS ─── */

export const colors = {
  // Brand / Primary (Blue)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  // Semantic
  success: '#10b981',   // emerald-500
  danger: '#f43f5e',    // rose-500
  warning: '#f59e0b',   // amber-500
  info: '#3b82f6',      // blue-500
  // Neutral (Slate-based)
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  // Chart palette
  chart: {
    income: '#10b981',
    expense: '#f43f5e',
    savings: '#3b82f6',
    purple: '#8b5cf6',
    amber: '#f59e0b',
    cyan: '#06b6d4',
  },
} as const;

/* ─── TYPOGRAPHY ─── */

export const typography = {
  // Font sizes (Tailwind classes)
  heading: {
    page: 'text-2xl font-bold tracking-tight',           // Page titles
    section: 'text-base font-semibold',                   // Section headers
    card: 'text-sm font-semibold',                        // Card titles
    stat: 'text-2xl font-bold tracking-tight',            // Stat values
  },
  body: {
    base: 'text-sm',                                       // Body text
    small: 'text-xs',                                      // Small text
    tiny: 'text-[11px]',                                   // Timestamps, meta
    label: 'text-sm font-medium',                          // Form labels
    caption: 'text-xs text-gray-400',                      // Captions
  },
} as const;

/* ─── SPACING ─── */

export const spacing = {
  page: 'space-y-8',            // Between major page sections
  section: 'space-y-4',         // Between section items
  card: 'p-5',                  // Card internal padding
  cardCompact: 'p-4',           // Compact card padding
  form: 'space-y-4',            // Between form fields
  inline: 'gap-2',              // Inline element gaps
  grid: 'gap-4',                // Grid gaps
} as const;

/* ─── BORDERS & RADIUS ─── */

export const radius = {
  card: 'rounded-xl',           // Cards, modals, large surfaces
  button: 'rounded-lg',         // Buttons, inputs, selects
  badge: 'rounded',             // Badges, small indicators
  avatar: 'rounded-full',       // Avatars, dots
  chip: 'rounded-lg',           // Filter chips, tags
} as const;

export const borders = {
  default: 'border border-gray-200',      // Standard border
  subtle: 'border border-gray-100',       // Very light border
  focus: 'border-primary-500',             // Focus state
  error: 'border-red-300',                 // Error state
} as const;

/* ─── SHADOWS ─── */

export const shadows = {
  sm: 'shadow-sm',              // Cards at rest
  md: 'shadow-md',              // Auth card, elevated cards
  lg: 'shadow-lg',              // Hover states, dropdowns
  xl: 'shadow-xl',              // Modals
  colored: {                     // Stat card shadows
    success: 'shadow-emerald-500/20 shadow-md',
    danger: 'shadow-rose-500/20 shadow-md',
    info: 'shadow-primary-500/20 shadow-md',
  },
  tooltip: '0 4px 20px rgba(0,0,0,0.08)',
} as const;

/* ─── TRANSITIONS ─── */

export const transitions = {
  fast: 'transition-all duration-150',     // Buttons, inputs
  normal: 'transition-all duration-200',   // Cards, hover states
  slow: 'transition-all duration-300',     // Layouts, page transitions
} as const;

/* ─── ICON SIZES ─── */

export const iconSizes = {
  xs: 12,    // Inline with tiny text
  sm: 14,    // Inline with small text, compact buttons
  md: 16,    // Default inline size, standard buttons
  lg: 18,    // Stat cards, nav items
  xl: 20,    // Page headers, feature icons
  '2xl': 24, // Empty states (centered)
  '3xl': 32, // Large empty states
  '4xl': 48, // Hero empty states
} as const;

/* ─── COMPONENT TOKENS ─── */

export const components = {
  button: {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2',
  },
  input: {
    base: 'px-3 py-2 text-sm rounded-lg border border-gray-200',
    focus: 'focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
    hover: 'hover:border-gray-300',
    error: 'border-red-300 focus:ring-red-500/20 focus:border-red-500',
  },
  card: {
    base: 'rounded-xl border border-gray-200 bg-white shadow-sm',
    hover: 'hover:shadow-md hover:-translate-y-0.5',
    padding: 'p-5',
  },
  modal: {
    overlay: 'bg-black/40 backdrop-blur-[2px]',
    content: 'rounded-xl shadow-xl bg-white',
    header: 'px-5 py-4 border-b border-gray-100',
    body: 'p-5',
  },
  badge: {
    base: 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
    income: 'bg-green-50 text-green-700',
    expense: 'bg-red-50 text-red-700',
  },
  table: {
    header: 'text-xs font-medium text-gray-500 uppercase tracking-wider',
    cell: 'text-sm text-gray-900',
    row: 'hover:bg-gray-50/80 transition-colors',
    border: 'divide-y divide-gray-100',
  },
} as const;

/* ─── CHART STYLING ─── */

export const chartConfig = {
  tooltip: {
    borderRadius: '10px',
    border: 'none',
    boxShadow: shadows.tooltip,
    fontSize: '12px',
  },
  axis: {
    fontSize: 11,
    fill: colors.gray[400],
  },
  grid: {
    stroke: '#f1f5f9',
    strokeDasharray: '3 3',
  },
  bar: {
    radius: [4, 4, 0, 0] as [number, number, number, number],
    barSize: 14,
  },
} as const;

/* ─── Z-INDEX SCALE ─── */

export const zIndex = {
  dropdown: 50,
  modal: 50,
  sidebar: 50,
  overlay: 40,
  toast: 60,
} as const;

