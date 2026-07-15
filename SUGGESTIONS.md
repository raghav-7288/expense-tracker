# SUGGESTIONS.md — Architecture Audit & Improvement Plan

> Full codebase audit performed July 15, 2026
> Project: ExpenseTracker — React 19 + TypeScript 6 + Vite 8 + Supabase SPA

---

## 1. Executive Summary

**Overall Grade: A-**

This is a professionally structured, well-maintained single-page application with:
- 99 source files across a clean folder structure
- Strict TypeScript (no `any`, `noUncheckedIndexedAccess`)
- 82% statement coverage across 481 tests
- Comprehensive dark mode, accessibility (WCAG AA), and responsive design
- Clean separation of concerns (services → hooks → components)
- Zero TODO/FIXME/HACK markers — no technical debt trail

**Key areas for improvement:**
1. Bundle size optimization (1.58 MB uncompressed JS)
2. Route-level code splitting (analytics module is heavy)
3. Test coverage gaps in page-level orchestration code
4. Missing CI/CD pipeline configuration
5. No E2E test coverage

---

## 2. High Priority Improvements

### 2.1 Code-Split the Analytics Module
- **Description:** The analytics page + 23 chart components + Recharts + engines/analytics.ts contribute ~40% of the bundle. Use `React.lazy()` + `Suspense` to load on demand.
- **Why it matters:** Initial load is 1.58 MB JS (439 KB gzipped). Users who never visit /analytics still download all chart code.
- **Priority:** High
- **Effort:** Low
- **Implementation:**
  ```tsx
  const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
  ```

### 2.2 Add CI/CD Pipeline
- **Description:** Create GitHub Actions workflow that runs lint, typecheck, tests, and build on every PR.
- **Why it matters:** Prevents regressions from being merged. Currently relies on manual local checks.
- **Priority:** High
- **Effort:** Low
- **Implementation:** `.github/workflows/ci.yml` with 4 steps

### 2.3 Add ESLint `no-console` Rule
- **Description:** Add `no-console: ['error', { allow: ['error', 'warn'] }]` to ESLint config.
- **Why it matters:** Prevents accidental `console.log` in production. Currently 2 `console.error` instances exist (acceptable).
- **Priority:** High
- **Effort:** Low

### 2.4 Add Rate Limiting Awareness
- **Description:** The app has no client-side throttling for rapid-fire mutations (e.g., double-click on "Add Transaction"). While the button has `loading` state, edge cases exist.
- **Why it matters:** Could create duplicate records if network is slow and user clicks rapidly.
- **Priority:** High
- **Effort:** Low
- **Implementation:** Add `disabled={isPending}` to all mutation trigger buttons (some already have this, verify completeness).

---

## 3. Medium Priority Improvements

### 3.1 Add Pre-commit Hooks
- **Description:** Configure `husky` + `lint-staged` to run `eslint --fix` and `tsc --noEmit` before commits.
- **Why it matters:** Catches issues before they enter the repository. Faster feedback than CI.
- **Priority:** Medium
- **Effort:** Low

### 3.2 Add E2E Tests
- **Description:** Add Playwright tests for critical user flows: signup → login → create transaction → view dashboard → view analytics.
- **Why it matters:** Unit tests mock everything. E2E tests catch integration issues (routing, auth redirects, actual Supabase interactions via test environment).
- **Priority:** Medium
- **Effort:** High

### 3.3 Improve Test Coverage for Page Components
- **Description:** Pages like `TransactionsPage` (46%), `CategoriesPage` (59%), `ProfilePage` (65%), `AnalyticsPage` (0%) have lower coverage because they orchestrate hooks/components.
- **Why it matters:** Page-level bugs (incorrect prop passing, wrong modal flow) would be caught.
- **Priority:** Medium
- **Effort:** Medium

### 3.4 Add Error Monitoring (Sentry)
- **Description:** Integrate Sentry or similar for production error tracking with source maps.
- **Why it matters:** The ErrorBoundary catches React errors, but no alerting exists. Silent failures in production go unnoticed.
- **Priority:** Medium
- **Effort:** Low

### 3.5 Database: Add pg_trgm for Full-Text Search
- **Description:** Transaction search uses `ilike('%term%')` which is O(n) per row. For 10K+ transactions, add a trigram GIN index.
- **Why it matters:** Performance degrades linearly with data growth.
- **Priority:** Medium (only matters at scale)
- **Effort:** Low
- **Implementation:** `CREATE EXTENSION pg_trgm; CREATE INDEX ... USING gin(description gin_trgm_ops);`

### 3.6 Add Optimistic Updates for Transaction Create
- **Description:** Currently only `useDeleteTransaction` has optimistic updates. Add to create/update for instant UI feedback.
- **Why it matters:** Perceived performance improvement. User sees their transaction immediately without waiting for server round-trip.
- **Priority:** Medium
- **Effort:** Medium

### 3.7 Add Request Deduplication for Category Resolution
- **Description:** `resolveCategoryColumns()` makes a Supabase query on every transaction create/update to determine if category is system or user. This could be cached client-side.
- **Why it matters:** Extra round-trip on every mutation. Could use the already-fetched categories query cache.
- **Priority:** Medium
- **Effort:** Low
- **Implementation:** Check TanStack Query cache for categories before hitting Supabase.

### 3.8 Add Import/Export for Transactions (CSV)
- **Description:** Analytics has CSV export for the current view. Add full import capability so users can bulk-upload from bank statements.
- **Why it matters:** Major UX improvement for new users migrating from other tools.
- **Priority:** Medium
- **Effort:** Medium

---

## 4. Low Priority Improvements

### 4.1 Add Service Worker for Offline Support
- **Description:** Register a service worker that caches the app shell and static assets. Show cached data when offline with a "You're offline" banner.
- **Why it matters:** PWA capability. Users can view their data without network.
- **Priority:** Low
- **Effort:** High

### 4.2 Add Bundle Analysis to CI
- **Description:** Use `rollup-plugin-visualizer` or `vite-bundle-analyzer` to track bundle size over time.
- **Why it matters:** Prevents bundle bloat from creeping in with new dependencies.
- **Priority:** Low
- **Effort:** Low

### 4.3 Drop the Legacy `categories` Table
- **Description:** The old `categories` table has 0 rows and no FK constraints pointing to it, but it still exists in the schema. Remove it to avoid confusion.
- **Why it matters:** Schema clarity. New developers might be confused by the unused table.
- **Priority:** Low
- **Effort:** Low
- **Implementation:** `DROP TABLE IF EXISTS public.categories;`

### 4.4 Add Recurring Transaction Support
- **Description:** Allow users to mark transactions as recurring (weekly, monthly, yearly) and auto-generate them.
- **Why it matters:** Reduces manual data entry for subscriptions, rent, salary.
- **Priority:** Low
- **Effort:** High

### 4.5 Add Multi-Currency Support
- **Description:** Currently one currency per user. Allow per-transaction currency with exchange rate conversion.
- **Why it matters:** Users who travel or have international income need this.
- **Priority:** Low
- **Effort:** High

### 4.6 Add `rel="noopener"` to External Links
- **Description:** Verify all `<a target="_blank">` links include `rel="noopener noreferrer"`.
- **Why it matters:** Security best practice (prevents tab-napping).
- **Priority:** Low
- **Effort:** Low

### 4.7 Improve Lighthouse Score
- **Description:** Run Lighthouse audit and address any performance/SEO/a11y issues (likely meta tags, preconnect hints).
- **Why it matters:** Improves perceived performance and SEO discoverability.
- **Priority:** Low
- **Effort:** Low

---

## 5. Suggested New Features

| Feature | Impact | Effort | Notes |
|---------|--------|--------|-------|
| **Budgets** | High | High | Set monthly/category spending limits with alerts |
| **Recurring Transactions** | High | Medium | Auto-generate from templates |
| **CSV Import** | Medium | Medium | Bulk upload bank statements |
| **Tags/Labels** | Medium | Medium | Cross-cutting metadata beyond categories |
| **Notifications** | Medium | Medium | Email/push alerts for budget limits |
| **Multi-user Sharing** | Low | High | Shared household budgets |
| **Currency Conversion** | Low | High | Per-transaction foreign currency |
| **Receipt Scanning (OCR)** | Low | High | Camera → auto-fill transaction |
| **Savings Goals** | Medium | Medium | Visual progress toward targets |
| **Dashboard Widgets** | Low | Medium | Customizable dashboard layout |

---

## 6. Technical Debt

| Item | Location | Impact | Notes |
|------|----------|--------|-------|
| Legacy `categories` table | Database | Low | 0 rows, no FKs, can be dropped |
| `as never` type assertion | `TransactionForm.tsx:55` | Low | Zod v4 + RHF resolver type mismatch — no better workaround currently |
| `console.error` in production | `AuthContext:28`, `ErrorBoundary:25` | Low | Acceptable for error paths, but could use structured logging |
| 1.58 MB JS bundle | Build output | Medium | Code splitting would reduce initial load by ~40% |
| `design-system.ts` unused at runtime | `src/styles/` | None | Serves as documentation only — no actual impact |

---

## 7. Refactoring Opportunities

### 7.1 Extract Transaction Amount Helper
- **Location:** `src/engines/analytics.ts` (31 occurrences of `Number(t.amount)`)
- **Suggestion:** Create `const amt = (t: Transaction) => Number(t.amount)` utility
- **Impact:** Marginal — reduces 5 characters per usage, slightly more readable
- **Verdict:** Optional — current pattern is idiomatic for reduce chains

### 7.2 Consolidate Category Resolution Logic
- **Location:** `src/services/transactions.ts` → `resolveCategoryColumns()`
- **Suggestion:** Cache the system category IDs from TanStack Query cache instead of hitting Supabase on every mutation
- **Impact:** Eliminates 1 network request per transaction create/update
- **Effort:** Low

### 7.3 Extract Shared Chart Tooltip Component
- **Location:** 7 chart components each define inline `contentStyle` for Recharts tooltip
- **Suggestion:** Create `<ChartTooltip>` wrapper with consistent dark-mode styling
- **Impact:** DRY, consistent styling across all charts
- **Effort:** Low

### 7.4 Unify Date Formatting
- **Location:** `src/utils/formatDate.ts` + `src/engines/analytics.ts` (has its own `toLocalISODate`)
- **Suggestion:** Move all date helpers to `formatDate.ts` and import from there
- **Impact:** Single source of truth for date operations
- **Effort:** Low

---

## 8. Quick Wins (< 1 hour each)

| # | Task | Impact |
|---|------|--------|
| 1 | Add `React.lazy()` for AnalyticsPage | -40% initial bundle |
| 2 | Add `no-console` ESLint rule | Prevent accidental logging |
| 3 | Drop legacy `categories` table | Schema clarity |
| 4 | Add `<link rel="preconnect">` for Supabase URL in index.html | Faster initial API calls |
| 5 | Add `loading="lazy"` to chart images if any exist | Faster LCP |
| 6 | Add `.nvmrc` with `22` | Consistent Node version for all contributors |
| 7 | Add favicon `<link>` preload | Prevents flash of no icon |
| 8 | Configure Vercel Analytics (free tier) | Real user monitoring |

---

## 9. Long-Term Roadmap

### Phase 1: Stability & Performance (1-2 weeks)
- [ ] Code-split analytics module
- [ ] Add CI/CD pipeline
- [ ] Add pre-commit hooks
- [ ] Add Sentry error monitoring
- [ ] Achieve 90%+ test coverage

### Phase 2: Feature Expansion (2-4 weeks)
- [ ] Budgets with alerts
- [ ] Recurring transactions
- [ ] CSV import
- [ ] Tags/labels system
- [ ] Savings goals

### Phase 3: Scale & Polish (4-8 weeks)
- [ ] E2E tests (Playwright)
- [ ] Service Worker + offline mode
- [ ] Email notifications
- [ ] Dashboard customization
- [ ] Performance monitoring dashboard

### Phase 4: Advanced Features (8+ weeks)
- [ ] Multi-currency with exchange rates
- [ ] Shared household accounts
- [ ] Receipt OCR scanning
- [ ] AI-powered spending insights
- [ ] Mobile app (React Native or PWA enhancement)

---

## Metrics Snapshot

| Metric | Current Value |
|--------|--------------|
| Source files | 99 |
| Test files | 63 |
| Total tests | 481 |
| Statement coverage | 82.19% |
| Branch coverage | 72.66% |
| Function coverage | 77.42% |
| Line coverage | 84.20% |
| Bundle size (JS) | 1.58 MB (439 KB gzipped) |
| TypeScript errors | 0 |
| ESLint errors | 0 |
| TODO/FIXME markers | 0 |
| Dependencies | 16 production, 13 dev |
| Node version | 22.x |

---

*Generated by architecture audit — July 15, 2026*

