# Release Checklist — Expense Tracker v1.0

**Reviewer:** Final Release Reviewer · **Date:** August 2, 2026
**Target:** Production (real users) · Vercel + Supabase

---

## 🚦 Release Status: ✅ READY FOR PRODUCTION

All **critical** checks pass. Every hard gate is green, security and RLS are
comprehensive, and there are **no critical or high-priority issues**. Three
**Medium** items are documented hardening recommendations/decisions (not
blockers) — the most important is the Vercel security-header decision, which is
constrained by the locked `vercel.json`.

### Production Readiness Score: **9 / 10**

−1 for documented Medium hardening items (Vercel headers not applied, recurring
idempotency guard, CSV-import test depth). None block core functionality; user
data is fully protected by RLS regardless.

---

## 🔴 Critical Issues

**NONE.** ✅

| Gate | Result |
| ---------------------------- | -------------------- |
| Production build succeeds | ✅ clean, no warnings |
| No type errors (`tsc -b` + tests) | ✅ 0 |
| No lint errors (`eslint .`) | ✅ 0 errors / 0 warnings |
| All tests pass | ✅ 1272 / 1272 |
| RLS on every table | ✅ 10 / 10 |
| No secrets committed | ✅ |
| Auth-gated routes protected | ✅ → `/login` |

---

## 🟠 High Priority Issues

**NONE.** ✅

---

## 🟡 Medium Priority Issues

| ID | Issue | Detail | Constraint / Action |
| -- | ----------------------------- | ----------------------------------------------------------------------------------- | ------------------- |
| **M1** | **Security headers not applied on Vercel** | Headers (X-Frame-Options, HSTS, nosniff, Referrer/Permissions-Policy) live in `public/_headers` — a **Netlify/Cloudflare** convention. Vercel reads headers only from `vercel.json`, which has **no `headers` block**, so they are **inactive on the Vercel target** (clickjacking/HSTS hardening missing). | `vercel.json` is **locked by project rule**; cannot be edited here. **Team decision:** add a `headers` array to `vercel.json`, or inject via an edge/proxy. Data stays protected by RLS + auth regardless. |
| **M2** | **Recurring generation lacks a DB idempotency guard** | No `UNIQUE(recurring_id, date)`; a multi-tab race or insert-succeeds/cursor-fails sequence could duplicate an occurrence. | Low likelihood (single-threaded JS + mount ref-guard). Harden if generation moves server-side: migration `013` + `upsert(onConflict)`. |
| **M3** | **Dashboard "Balance" semantics** | Once any account exists, account-less transactions are excluded from the headline Balance (accounts = source of truth). | Product decision — confirm intent; document for users if kept. |

---

## 🟢 Low Priority Issues

| ID | Issue | Detail |
| -- | ------------------------------------- | ------------------------------------------------------------------------------ |
| **L1** | CSV **Import** UI test depth | `ImportModal.tsx` ~11% coverage. Export is regression-tested. |
| **L2** | `services/transactions.ts` loan internals | ~49% stmts — loan recalc math under-tested (hooks are covered). |
| **L3** | Duplicate migration index name | `idx_user_categories_active` in both `002` and `003`; `003`'s partial index is silently skipped. Fix via a new migration, not by editing applied history. |

---

## ✅ Fixed Issues (release-hardening cycle)

| Area | Fix |
| ---------------------- | ---------------------------------------------------------------------- |
| Recurring `recurring_id` | Normalizer preserves the FK → 🔁 badge & rule linkage work |
| Transactions hub | Unknown `/transactions/*` falls back to the hub (no bounce to `/dashboard`) |
| Inline category create | `mutateAsync` wrapped in try/catch — no unhandled rejection |
| Category soft-delete | Migration `012` partial unique index → deleted names reusable |
| Duplicate category | Friendly toast instead of raw `23505` DB error |
| Search | Debounced at the query boundary — no request per keystroke |
| Loan disbursement | Local `getToday()` (was UTC) — no off-by-one near midnight |
| Account delete | Invalidates dashboard + analytics (stale data fixed) |
| Lint hygiene | `watch()` → `useWatch` across 6 forms → **0 warnings** |
| Dead code | Removed unused `getTransactionTotals()` |
| Bundle | `manualChunks` vendor split — entry **481 kB → 49.6 kB** |
| Rendering | Memoized recharts dashboard charts + `StatCard` |
| Test fix | `RecurringList` income-amount assertion corrected (`+$5,000.00`) |

---

## 🧪 Test Results

| Metric | Value |
| ------------ | ---------------------------- |
| Test files | **101 passed** / 101 |
| Tests | **1272 passed** / 1272 (0 failing, 0 flaky) |
| Integration | 7 (loans flow, hub routing, soft-delete uniqueness, dashboard widgets) |
| Regression | 5 (bug-hunt, csv-export, category-filter, error-handling, modal-stability) |

**Domain breadth:** analytics (10 cmp + 3 engine), ui (15), hooks (12), pages (12),
services (7), dashboard (5), auth (3), transactions (3), recurring (2), categories (2),
accounts (1), loans (1).

---

## 📊 Coverage Summary

| Metric | Coverage |
| ---------- | -------- |
| Statements | **82.13%** |
| Branches | **72.44%** |
| Functions | **80.75%** |
| Lines | **85.03%** |

Strong on core logic (analytics engine 100% stmts, recurring service 91%,
transactions/recurring hooks 96–99%). Lighter: CSV import UI, loan-transaction
service internals (L1/L2).

---

## ⚡ Performance Summary

| Item | Status |
| --------------------- | ------------------------------------------------------------ |
| Production build | ✅ clean, ~0.33s |
| Entry bundle | ✅ **49.6 kB** (gzip 14.3 kB) — down 90% from 481 kB |
| Vendor splitting | ✅ `react` / `charts` / `supabase` / `motion` / `forms` / `router` / `query` / `icons` cached independently |
| Critical path | ✅ recharts (464 kB) & framer-motion (132 kB) deferred off entry |
| Code splitting | ✅ all 12 routes lazy + `Suspense` |
| Rendering | ✅ memoized recharts charts + `StatCard`; `useMemo`/`useCallback` on derived data |
| React Query cache | ✅ staleTime 5m / gcTime 15m / retry 1 / no refetch-on-focus |

---

## 🔒 Security Summary

| Check | Result |
| ------------------------------- | ------------------------------------------------ |
| RLS enabled on all tables | ✅ **10/10** (36 policies) |
| Ownership enforced (`auth.uid()`) | ✅ per-user SELECT/INSERT/UPDATE/DELETE |
| Authentication | ✅ Supabase Auth (email/password + Google OAuth) |
| Secrets in source | ✅ none (`service_role`/key scan clean) |
| Env handling | ✅ `.env` gitignored; only `.env.example` committed; client fails fast; anon key only |
| XSS vectors | ✅ no `dangerouslySetInnerHTML` / `eval` / `innerHTML` |
| Debug code | ✅ no `console.log` / `debugger` (only `console.error` in error handlers) |
| Injection guards | ✅ LIKE-wildcard escaping + UUID validation on filters |
| Route protection | ✅ `ProtectedRoute` → `/login` when unauthenticated |
| SPA rewrite (Vercel) | ✅ present in `vercel.json` |
| HTTP security headers | ⚠️ defined in `public/_headers` but **not applied on Vercel** (M1) |

---

## Domain Validation Detail

| Domain | Status | Evidence |
| --------------------- | ------ | ------------------------------------------------------------------ |
| Every route | ✅ | nested hub + legacy redirects + fallback (routing integration tests) |
| CRUD (all entities) | ✅ | services + hooks tested incl. optimistic delete + rollback |
| Database integrity | ✅ | FKs, CHECK constraints, `ON DELETE` rules across 12 migrations |
| Analytics correctness | ✅ | engine 100% stmts; month-boundary & divide-by-zero guards |
| Account balances | ✅ | server-side `get_balance_summary` RPC; delete invalidation fixed |
| Recurring | ✅ | scheduling core exhaustively tested (month-end, leap year, end-date, idempotent replay, safety cap) |
| Loan calculations | ✅ | disbursement/repayment accounting + rollback; local-date fix |
| CSV export | ✅ | regression-tested |
| CSV import | ⚠️ | functional; light test coverage (L1) |
| Responsive design | ✅ | 199 responsive utils; mobile drawer; 44px targets; safe-area; 320px+ |
| Accessibility | ✅ | focus-visible, aria-*, reduced-motion, semantic tables |
| Error handling | ✅ | ErrorBoundary + ErrorState + `{data,error}` tuples; regression suite |
| Dark mode | ✅ | comprehensive `body.dark-mode` architecture (all sizes) |

---

## Deployment Notes

1. **Before first deploy:** set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel env vars.
2. **Apply migrations** `001`–`012` in Supabase (esp. `011` recurring, `012` category-uniqueness).
3. **M1 decision:** resolve the security-header approach given the `vercel.json` lock.
4. **Post-launch:** monitor Supabase for slow queries; consider server-side pagination past ~2000 txns.

---

## Sign-off

- [x] Build / Lint / Typecheck / Tests / Coverage green
- [x] Security & RLS verified (10/10 tables, no secrets)
- [x] No critical or high-priority issues
- [x] Accessibility & responsive (320px+) verified
- [x] Medium/Low issues documented with owners/decisions
- [ ] **Team decision on M1** (Vercel security headers vs. `vercel.json` lock) — top follow-up

**Verdict: ✅ READY FOR PRODUCTION** — ship v1.0, with M1 tracked as the top follow-up.
