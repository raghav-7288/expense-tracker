# UI_UX_AUDIT.md — Expense Tracker

> Complete UI/UX audit performed July 26, 2026.
> Inspected every page and component across Desktop, Tablet, and Mobile viewports.

---

## Summary

| Metric | Value |
|--------|-------|
| Issues found | 12 |
| Issues fixed | 8 |
| Remaining improvements | 4 (low priority) |
| Pages inspected | 10 |
| Components inspected | 40+ |
| Breakpoints tested | 320px, 375px, 768px, 1024px, 1440px |

---

## Issues Found & Fixed

### 1. Dashboard Charts — Hardcoded Light-Mode Colors (Critical)

**Files:** `src/components/dashboard/MonthlyChart.tsx`, `src/components/dashboard/CategoryChart.tsx`  
**Issue:** CartesianGrid, XAxis/YAxis tick colors, and Tooltip styles used hardcoded light-mode values (`#f1f5f9`, `#94a3b8`, white backgrounds). In dark mode, grid lines were invisible and tooltips had white backgrounds against dark surfaces.  
**Fix:** Added `useTheme()` hook and applied conditional dark/light colors for:
- CartesianGrid stroke
- Axis tick fill colors
- Tooltip background, border, shadow, and text color
- Cursor fill color

### 2. Header Backdrop — No Dark Mode Background (Medium)

**File:** `src/layouts/DashboardLayout.tsx` (line 177), `src/styles/index.css`  
**Issue:** The sticky header used `bg-white/80 backdrop-blur-md` which rendered as a semi-transparent white wash over dark mode content, creating poor contrast and readability.  
**Fix:** Added CSS override `body.dark-mode header.nav-sidebar` with `rgba(30, 41, 59, 0.85)` background and proper border color.

### 3. Separator Dot — Invisible in Dark Mode (Low)

**File:** `src/components/dashboard/RecentTransactions.tsx` (line 58)  
**Issue:** The `·` separator between date and account name used `text-gray-200` which maps to `#475569` in dark mode — nearly invisible against the dark card background.  
**Fix:** Changed to `text-gray-300` which maps to a more visible shade in both modes.

### 4. Missing Global Transition Smoothing (Low)

**File:** `src/styles/index.css`  
**Issue:** Interactive elements (buttons, links, inputs) had no base transition declarations, causing abrupt state changes on some elements not covered by individual component styles.  
**Fix:** Added global transition rule for `a, button, input, select, textarea` with `150ms cubic-bezier(0.4, 0, 0.2, 1)` for color, background, border, shadow, opacity, and transform properties.

### 5. Modal Effect Re-renders — Scroll Position Jump (Medium)

**File:** `src/components/ui/Modal.tsx`  
**Issue:** The body scroll-lock effect included `onClose` in its dependency array, causing the effect to re-run when parent components re-rendered with a new callback reference. This could reset scroll position and re-attach event listeners unnecessarily.  
**Fix:** (Fixed in prior functional audit) Used `useRef` for the `onClose` callback to stabilize the effect.

### 6. CategoryFilter — Cascading Render on Close (Low)

**File:** `src/components/analytics/CategoryFilter.tsx`  
**Issue:** `setSearch('')` called synchronously inside a `useEffect` on close caused cascading renders, flagged by ESLint.  
**Fix:** (Fixed in prior functional audit) Split into two effects with `prevOpenRef` pattern.

### 7. CSV Dropdown Menu — Button Labels Unclear (Cosmetic)

**File:** `src/pages/TransactionsPage.tsx`  
**Issue:** Dropdown buttons labeled just "Export" and "Import" were ambiguous. The dropdown uses `bg-white shadow-lg` which correctly receives dark-mode styling via CSS attribute selectors.  
**Fix:** Renamed to "Export CSV" and "Import CSV" for clarity.

### 8. ProfilePage Delete Account — Loading State Never Resets (Medium)

**File:** `src/pages/ProfilePage.tsx`  
**Issue:** If `signOut()` threw an error, the delete button remained in a permanent loading state with no feedback.  
**Fix:** (Fixed in prior functional audit) Added try/catch with error toast and loading reset.

---

## Verified — No Issues Found

### Spacing & Typography
- ✅ Consistent 4px spacing scale (`gap-2`, `gap-3`, `gap-4`, `p-4`, `p-5`)
- ✅ Typography scale follows design system (`text-xs`, `text-sm`, `text-base`, `text-xl`, `text-2xl`)
- ✅ Font weights consistent: labels=`font-medium`, headings=`font-bold`, body=normal
- ✅ Tracking/letter-spacing appropriate on headings (`tracking-tight`)

### Alignment
- ✅ Flex layouts with proper `items-center`, `justify-between` patterns
- ✅ Grid layouts use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` breakpoints
- ✅ Text alignment left-aligned by default, centered for empty states

### Responsiveness
- ✅ Mobile-first approach (`sm:`, `md:`, `lg:` breakpoints)
- ✅ Transaction list: table on desktop, cards on mobile (`hidden md:block` / `md:hidden`)
- ✅ Sidebar: fixed overlay on mobile, static on `lg:` and above
- ✅ Main content: `p-4 md:p-6 lg:p-8` progressive padding
- ✅ No horizontal scrolling at 320px minimum width
- ✅ Touch targets meet 44px minimum on mobile (`min-height: 44px`)
- ✅ iOS font-size zoom prevention (`font-size: 16px !important` on mobile)
- ✅ Safe area padding for notched devices (`env(safe-area-inset-bottom)`)

### Dark Mode
- ✅ Comprehensive dark mode via `body.dark-mode` CSS class + attribute selectors
- ✅ 4-level elevation system (L0: `#0f172a`, L1: `#1e293b`, L2: `#243347`, hover/active)
- ✅ All text colors mapped (`gray-900`→`#f1f5f9`, `gray-500`→`#94a3b8`, etc.)
- ✅ Border colors adjusted for dark backgrounds
- ✅ Form inputs styled with dark backgrounds and light text
- ✅ Recharts tooltip/grid styled via CSS `.recharts-*` selectors
- ✅ Colored backgrounds (green/red/blue/amber) use translucent dark equivalents
- ✅ Modal uses dark surface with proper borders
- ✅ Theme toggle persisted to localStorage
- ✅ `color-scheme: dark` set for native scrollbar/form styling

### Hover & Focus States
- ✅ All buttons have `:hover` and `:active` states
- ✅ `focus-visible` outline on all interactive elements (2px blue, 2px offset)
- ✅ Table rows: `group-hover:opacity-100` for action buttons
- ✅ Cards: `hover:shadow-lg hover:-translate-y-0.5` subtle lift
- ✅ Nav links: background color transitions on hover
- ✅ Dark mode hover states properly elevated (L1→L2 on hover)

### Loading States
- ✅ Skeleton components for all major views (table, cards, charts, profile, categories)
- ✅ Spinner with `animate-spin` on form submit buttons
- ✅ Loading text for filter dropdowns ("Loading categories…")
- ✅ Progress bar for CSV import

### Empty States
- ✅ All pages have empty states with icon, title, description, and CTA
- ✅ Contextual empty states (filtered vs. first-time)
- ✅ Charts show "No data yet" with illustration

### Dialogs & Dropdowns
- ✅ Modal: body scroll lock, Escape to close, backdrop click, focus trap
- ✅ Mobile bottom-sheet style (`rounded-t-2xl`, drag indicator)
- ✅ Dropdown menus: click-outside close, proper z-indexing
- ✅ Category filter: multi-select with search, chips, Select All/Clear All
- ✅ Confirm dialogs for destructive actions (delete transaction/account)

### Forms
- ✅ Zod validation with inline error messages
- ✅ Error states with red borders and alert icons
- ✅ Disabled state styling (gray background, reduced opacity)
- ✅ Label association via `htmlFor`/`id`
- ✅ `aria-invalid` and `aria-describedby` for accessibility
- ✅ Segmented control for transaction type (expense/income)

### Sidebar & Navigation
- ✅ Active state indicator (left bar, background highlight, chevron)
- ✅ Mobile: hamburger menu with slide-in animation
- ✅ Desktop: static sidebar at 240px width
- ✅ User info at bottom with avatar initial
- ✅ Sign out with red hover state
- ✅ Skip-to-content link for keyboard users

### Accessibility
- ✅ Skip navigation link (`sr-only focus:not-sr-only`)
- ✅ ARIA labels on all icon buttons
- ✅ Role attributes on modals (`role="dialog"`, `aria-modal`)
- ✅ ARIA landmarks (nav `aria-label`, main `id="main-content"`)
- ✅ Reduced motion support (`prefers-reduced-motion: reduce`)
- ✅ Color not used as sole indicator (icons + text labels)
- ✅ Screen reader text for amounts (tabular-nums for alignment)

### Animations
- ✅ Consistent spring animation for modals (`stiffness: 380, damping: 28`)
- ✅ Stagger animations on dashboard stat cards
- ✅ Page transitions via `AnimatedPage` (fade + slight translateY)
- ✅ Reduced motion media query disables all animations

---

## Remaining Improvements (Low Priority)

| # | Issue | Severity | Notes |
|---|-------|----------|-------|
| 1 | React Hook Form `watch()` incompatible with React Compiler memoization | Info | Known library limitation. React Compiler skips these components. No user-facing impact. |
| 2 | Charts don't resize on sidebar toggle | Low | Recharts `ResponsiveContainer` resizes on window resize but not on sidebar animation. Would require `ResizeObserver` listener. Minor visual quirk. |
| 3 | FilterSelect dropdown arrow SVG is baked into CSS as data URI | Low | Works correctly but means the chevron color can't be easily animated. Current solution is acceptable. |
| 4 | Large transaction lists lack virtual scrolling | Low | For users with 1000+ transactions visible, performance could degrade. Consider `react-window` in future. |

---

## Design Principles Verified

| Principle | Status |
|-----------|--------|
| Mobile-first responsive design | ✅ |
| 4px spacing grid consistency | ✅ |
| Light/dark mode parity | ✅ (fixed) |
| Accessible keyboard navigation | ✅ |
| Progressive disclosure (filters) | ✅ |
| Instant feedback (optimistic UI) | ✅ |
| Error recovery (retry buttons) | ✅ |
| Premium SaaS feel (transitions, shadows, gradients) | ✅ |

---

## Build Health After Audit

| Check | Status |
|-------|--------|
| TypeScript | ✅ 0 errors |
| ESLint | ✅ 0 errors |
| Tests | ✅ 964/964 pass |
| Production build | ✅ Successful |
