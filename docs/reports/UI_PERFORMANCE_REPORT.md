# UI/UX & Frontend Performance Report

**Date:** August 2, 2026
**Reviewer:** Senior Product Designer & Frontend Performance Engineer (audit)
**App:** Expense Tracker — React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase

---

## Executive Summary

The application is **visually mature and well-engineered**. The design system already
implements the large majority of the items on the audit checklist to a high
standard — focus-visible rings, a comprehensive dark mode, skeleton loaders,
reduced-motion support, safe-area handling, and strong responsive coverage
(199 responsive-utility usages across components).

The highest-value opportunity was **not** cosmetic — it was **bundle
code-splitting**. I shipped that plus targeted memoization of the
recharts-heavy dashboard subtrees. All changes preserve existing behavior:
**lint 0 / typecheck 0 / build clean / 1272 tests passing.**

> **Process note — a false alarm caught by verification.** An initial broad scan
> flagged "almost ZERO dark-mode support" (hardcoded `bg-white` / `text-gray-*`).
> Before acting I inspected `src/styles/index.css` and found a **deliberate,
> comprehensive dark-mode architecture** (~370 lines of `body.dark-mode
> [class*="…"]` overrides covering typography, surfaces, borders, forms, hovers,
> recharts, scrollbars, and focus). Those "hardcoded" classes **do** adapt. Adding
> `dark:` variants would have been redundant and risky. **No dark-mode code was
> changed.**

---

## 1. Changes Applied (safe, verified)

### 1.1 Bundle code-splitting — `vite.config.ts` (biggest win)

Added `build.rollupOptions.output.manualChunks` to split large, stable vendors
into their own long-term-cacheable chunks. The entry bundle previously bundled
React, Router, React Query, and Supabase (the last via `AuthContext`) together.

**Entry chunk (the app shell that gates first render):**

| | Raw | Gzip |
| --------------- | ------- | -------- |
| **Before** (`index`) | 481.5 kB | 145.8 kB |
| **After** (`index`) | **49.6 kB** | **14.3 kB** |
| **Reduction** | **−90%** | **−90%** |

**Resulting vendor chunks (now isolated & independently cached):**

| Chunk | Raw | Gzip | Eager? |
| ---------- | -------- | ------- | ------------------------------- |
| `react` | 357.4 kB | 108.5 kB | yes (stable — rarely changes) |
| `charts` (recharts) | 464.4 kB | 131.6 kB | **no** — only Analytics/Dashboard |
| `supabase` | 202.9 kB | 51.8 kB | yes (auth) |
| `motion` (framer-motion) | 132.6 kB | 43.9 kB | mostly deferred |
| `forms` (RHF+zod) | 95.9 kB | 28.3 kB | no — loaded with first form |
| `router` | 41.8 kB | 15.0 kB | yes |
| `query` | 37.0 kB | 11.2 kB | yes |
| `icons` (lucide) | 16.3 kB | 5.9 kB | shared |

**Why it matters**

- **Caching:** previously *any* app-code change re-hashed the entire 481 kB entry,
  forcing users to re-download React+Router+Query+Supabase. Now those vendors keep
  their hash across app deploys and stay cached.
- **Critical path:** recharts (464 kB) and framer-motion (132 kB) are no longer in
  the entry path — the login/first-paint route no longer pays for charting code.
- **Parallelism:** the browser fetches vendor chunks concurrently instead of one
  serial megabundle.

> `vercel.json` was **not** touched (per project rule) — only `vite.config.ts`.

### 1.2 Memoization of expensive dashboard subtrees

Wrapped three **propless, self-contained** components in `React.memo` so they no
longer re-render when the parent `DashboardPage` re-renders for unrelated reasons
(e.g. a currency/context change elsewhere). Each is driven entirely by its own
React Query hooks, so correctness is unchanged — they still update when *their*
data changes.

| File | Rationale |
| ------------------------------------------ | ----------------------------------------------- |
| `src/components/dashboard/MonthlyChart.tsx` | recharts `BarChart` — reconciliation is costly |
| `src/components/dashboard/CategoryChart.tsx` | recharts `PieChart` — reconciliation is costly |
| `src/components/dashboard/StatCard.tsx` | pure leaf rendered 4× per dashboard |

---

## 2. UI/UX Audit — by category

Legend: ✅ already strong (verified) · 🔧 changed · 💡 recommendation

| Area | Status | Evidence / Notes |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------- |
| **Spacing / alignment** | ✅ | Consistent Tailwind scale; card padding `p-4 sm:p-5`; grid gaps standardized at `gap-4`. |
| **Typography** | ✅ | Base 16px (prevents iOS zoom), responsive `text-xl sm:text-2xl`, `tracking-tight`, `tabular-nums` on all monetary values. |
| **Focus states** | ✅ | Global `:focus-visible` outline in `index.css`; `Button`/`Input`/`Select`/`TextArea` add explicit rings; `Dropdown` has full roving-tabindex keyboard nav. |
| **Hover states** | ✅ | Buttons, cards (`hover:-translate-y-0.5 hover:shadow-lg`), rows, nav links — all with `transition` + dark-mode hover overrides. |
| **Animations** | ✅ | framer-motion (4 files) for page/stagger; CSS transitions elsewhere; **`prefers-reduced-motion` fully honored** in `index.css`. |
| **Loading experience** | ✅ | Rich skeletons (`SkeletonCard/Table/Chart/PieChart/RecentTransactions`) on every data view; `Button` spinner; route `Suspense` fallback. |
| **Empty states** | ✅ | Shared `EmptyState` on list pages; `RecentTransactions` & charts use richer bespoke empty states **with CTAs** (intentional, kept). |
| **Dark / light mode** | ✅ | Comprehensive `body.dark-mode` architecture (see process note) incl. recharts, scrollbars, autofill, selection. **Verified, unchanged.** |
| **Charts** | ✅/🔧 | Theme-aware recharts (axis/tooltip/grid colors switch on `darkMode`); empty-state guards; **memoized** (§1.2). |
| **Tables** | ✅ | `TransactionList` uses semantic `<table>` with `scope="col"`, `sr-only` action header, hover row reveal of actions. |
| **Forms** | ✅ | RHF + zod; `aria-invalid` / `aria-describedby`; inline errors; 44px touch targets; 16px inputs (no iOS zoom). |
| **Dialogs** | ✅ | `Modal`/`ConfirmDialog` with `overscroll-contain`, momentum scroll, dark-mode surfaces, sticky footers. |
| **Navigation** | ✅ | Responsive drawer (`-translate-x-full` → `translate-x-0`) with backdrop on mobile, static sidebar `lg:`, `aria-label`s; Transactions hub tab bar is `overflow-x-auto`. |

### Desktop / Tablet / Mobile

- **Responsive coverage is strong** — 199 responsive-utility usages; layouts move
  from `grid-cols-1` → `lg:grid-cols-3/4`; header actions collapse (`hidden xs:inline`).
- **Mobile ergonomics** are explicitly handled in `index.css`: 44px min touch
  targets, 16px inputs (no zoom), `safe-area-inset` padding, `touch-manipulation`
  (removes 300ms tap delay), `overflow-x: hidden` guards, hidden scrollbars.
- **Mobile nav** is a proper slide-in drawer with a dismiss backdrop and a close
  button; the sidebar becomes static at `lg`.

---

## 3. Performance Audit — by category

| Optimization | Status | Notes |
| ------------------- | ------ | --------------------------------------------------------------------------- |
| **Lazy loading** | ✅ | All 12 route pages are `lazy()` + `Suspense`; recharts/framer-motion now deferred off the entry path (§1.1). |
| **Bundle size** | 🔧 | Entry −90% (481→49.6 kB); vendors split for caching (§1.1). |
| **React rendering** | 🔧 | Memoized the recharts dashboard subtrees + `StatCard` (§1.2). |
| **Memoization** | ✅/🔧 | `TransactionsPage`/`AnalyticsPage` already `useMemo`/`useCallback` their derived data & handlers; added 3 `memo()` wrappers. |
| **React Query cache** | ✅ | Sound global config: `staleTime` 5 min, `gcTime` 15 min, `retry` 1, `refetchOnWindowFocus:false`; prefix-based invalidation keeps lists/dashboard/analytics coherent. |
| **StrictMode / ErrorBoundary** | ✅ | Both present at the root. |

---

## 4. Prioritized Recommendations (not auto-applied)

Intentionally deferred because they carry refactor risk and warrant a focused PR
+ review, exceeding the "safe fixes" bar of this pass:

1. **`TransactionList` row extraction + `memo` (Medium).** Rows are inline within
   `.map` with per-row closures (`setEditingTransaction(t)`). Extracting a
   `memo`'d `TransactionRow` with stable `useCallback` handlers would cut
   re-renders on large lists. Risk: the row has loan/badge/avatar branching —
   needs its own tests. *Do this if lists routinely exceed ~100 rows.*
2. **Virtualize very long transaction lists (Low/Medium).** If unpaginated lists
   can reach thousands of rows, add `@tanstack/react-virtual`. Skip if lists are
   always filtered/paginated.
3. **Icon import hygiene (Low).** Continue importing named icons from
   `lucide-react` (already tree-shaken); the new `icons` chunk keeps them cached.
4. **Route prefetch on intent (Low).** Prefetch a lazy route's chunk on nav-link
   `hover`/`focus` for near-instant transitions.
5. **`Dropdown` item focus (Info — no change).** `focus:bg-gray-50` is retained
   deliberately: items receive focus *programmatically* via roving tabindex, where
   `:focus-visible` can be applied inconsistently across browsers. Current behavior
   is correct.

---

## 5. Verification

| Gate | Result |
| ---------------- | ------------------------------------ |
| ESLint (`eslint .`) | ✅ 0 errors, 0 warnings |
| Typecheck (`tsc -b`) | ✅ 0 errors |
| Build (`vite build`) | ✅ clean, no warnings (~0.33s) |
| Tests (`vitest run`) | ✅ **101 files / 1272 passing / 0 failing** |

No functional regressions. Cosmetic/behavioral surface is unchanged; the wins are
in **initial-load caching, critical-path weight, and render efficiency** — plus a
documented confirmation that the existing dark-mode, responsive, a11y, and loading
systems are already production-grade.

