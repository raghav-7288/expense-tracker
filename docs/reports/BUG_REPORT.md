# BUG_REPORT.md

**Audit type:** Full-application bug hunt (QA Engineer + Software Architect)
**Date:** 2026-08-02
**Method:** Systematic read-through of every subsystem — auth, dashboard, transactions, recurring, loans, categories, accounts, analytics, profile, currency, theme, CSV import/export, search/filter/sort, utils, routing — tracing data flow from DB → service → hook → UI. Fixes applied for safe issues with regression tests; risks requiring product/schema decisions documented.

---

## Result at a glance

| Gate | Result |
|------|--------|
| Lint (`eslint .`) | ✅ 0 errors (6 pre-existing `watch()`/React-Compiler warnings) |
| Typecheck (app `tsc -b` + tests) | ✅ clean |
| Build (`vite build`) | ✅ clean (~0.34s) |
| Tests | ✅ **98 files / 1224 passing / 0 failing** (was 97 / 1218; **+6**) |

**3 bugs found and fixed** (1 medium, 2 low), each with regression tests. **No critical or high-severity bugs remain** in the reviewed surface after 6 prior audits — the codebase is in strong shape.

---

## Bugs Found & Fixed

### 🐞 B-1 (Medium) — Search fired one Supabase query per keystroke (no debounce)

- **Where:** `src/components/transactions/TransactionFilters.tsx` → `src/pages/TransactionsPage.tsx` → `useTransactions`.
- **Root cause:** The search box called `onChange({ ...filters, search: e.target.value })` on **every keystroke**. `filters` is part of the React Query key (`queryKeys.transactions.list(userId, filters)`), so each keystroke triggered a **new network request** to Supabase (typing "groceries" = 9 requests). Besides being wasteful, it's a mild request-race source (rapid in-flight queries).
- **Fix:** Added a reusable `useDebouncedValue` hook (`src/hooks/useDebouncedValue.ts`) and applied it at the **query level** in `TransactionsPage`: the search box stays fully responsive (still controlled by `filters`), but only the *debounced* search (300ms) feeds `useTransactions`. Every other filter (type, category, account, date, sort) still applies immediately.
  - *Design note:* I deliberately debounced at the query boundary rather than adding local state to the filter bar — that avoids `react-hooks/refs` and `react-hooks/set-state-in-effect` lint violations and keeps the filter bar a pure controlled component.
- **Tests:** `tests/hooks/useDebouncedValue.test.tsx` (4) — returns initial immediately, updates only after the delay, **coalesces rapid changes into one trailing update**, and clears its timer on unmount (no leak/late update).

### 🐞 B-2 (Low) — Loan disbursement stamped with a UTC date instead of the local date

- **Where:** `src/services/loans.ts` → `createLoan`.
- **Root cause:** The disbursement transaction used `date: new Date().toISOString().split('T')[0]`, which is the **UTC** calendar date. Everywhere else in the app uses local dates via `getToday()` (recurring generator, etc.). Near midnight, a loan created locally could be recorded on the wrong calendar day (off-by-one), making it inconsistent with the rest of the ledger and with `recordRepayment` (which uses the form's local date).
- **Fix:** Use `getToday()` (local `YYYY-MM-DD`) for the disbursement date, consistent with the rest of the codebase.
- **Tests:** `tests/services/loans.test.ts` (+1) — pins `getToday()` and asserts the transactions insert receives the local date, not a UTC one.

### 🐞 B-3 (Low) — Deleting an account left analytics/dashboard caches stale

- **Where:** `src/hooks/useAccounts.ts` → `useDeleteAccount`.
- **Root cause:** `onSuccess` invalidated only `['accounts']` and `['transactions']`. But `transactions.account_id` is `ON DELETE SET NULL` (migration 007), so deleting an account **mutates existing transactions** (their `account_id` → null). That changes account-based analytics and the dashboard's unified balance, yet neither `['dashboard']` nor `['analytics']` was invalidated → stale views until an unrelated refetch.
- **Fix:** `useDeleteAccount` now also invalidates `['dashboard']` and `['analytics']` (in addition to accounts + transactions), matching the invalidation discipline used by transaction mutations.
- **Tests:** `tests/hooks/useAccounts.test.tsx` (+1) — spies on `invalidateQueries` and asserts all four cache prefixes (`accounts`, `transactions`, `dashboard`, `analytics`) are invalidated on delete.

---

## Root-cause summary

| Bug | Category | Root cause | Fix |
|-----|----------|-----------|-----|
| B-1 | Performance / request-race | Search value is part of the query key and updated per keystroke | Debounce the search at the query boundary (`useDebouncedValue`, 300ms) |
| B-2 | Incorrect calculation (timezone) | `toISOString()` yields a UTC date | Use local `getToday()` |
| B-3 | Stale React Query cache | Missing cache invalidations after a mutation that edits related rows | Invalidate dashboard + analytics on account delete |

---

## Areas Verified — No Bugs Found

The following were traced end-to-end and found correct:

- **Authentication** — `AuthContext` (session bootstrap + `onAuthStateChange` with `unsubscribe` cleanup), `ProtectedRoute` (loading → spinner, unauth → `/login`, else children). No leaks, no broken redirects.
- **Transactions service** — filters, **search wildcard escaping** (`%_\` are escaped before `ilike`), UUID validation on `category_id`/`account_id` (injection-safe), sort with stable secondary keys, `normalizeTransaction` (incl. `recurring_id`, fixed in a prior audit).
- **Dashboard** — `useMonthlyData`/`useCategoryBreakdown` correctly exclude loan types and guard division; `netSavings`/`unifiedBalance` math correct (see R-1 for a semantics caveat).
- **Analytics engine** — `diffDays` is inclusive and matches the daily-series loop (no off-by-one); `getPreviousPeriod` preserves period length; `computeSummary` guards divide-by-zero (`savingsRate`, `avgMonthlySpending`, `pctChange`) and empty arrays (`Math.max`). `useAnalytics` excludes loan transactions and memoizes every derivation.
- **Currency** — every `formatCurrency`/`formatCompactCurrency` call site passes the user's `currency` (from `useCurrency()`); no accidental USD fallbacks. Date utils are timezone-safe (local parsing/formatting).
- **Theme** — `dark-mode` body class is backed by a full `body.dark-mode` CSS block; `localStorage` access is `try/catch`-guarded.
- **CSV Import/Export** — import writes `account_id: null` (correctly doesn't touch account balances) and never sets `recurring_id`; category matching is case-insensitive and safe. Export flows all transactions (incl. generated recurring rows) through unchanged.
- **Loans** — create/repay use sound manual-compensation rollback; repayments are tagged with the loan's own type so they're excluded from every income/expense calculation; overpayment is clamped.

---

## Remaining Risks (documented — not auto-fixed)

| # | Risk | Severity | Why not auto-fixed | Recommendation |
|---|------|----------|--------------------|----------------|
| R-1 | **Dashboard "Balance" excludes account-less transactions once any account exists.** `unifiedBalance` sums account balances when ≥1 account exists; a transaction saved with no account is then invisible in that card (though still in income/expenses). | Medium | Changing balance semantics is a **product decision**, not a mechanical fix. | Either (a) add an "Unassigned" bucket to the account-balance sum, or (b) keep `income − expenses` as the balance and show per-account balances separately. |
| R-2 | **Recurring generation has no DB `UNIQUE(recurring_id, date)` guard** → duplicate transactions possible under multi-tab or insert-succeeds/cursor-update-fails sequences. | Medium | Requires a **schema migration you must run in Supabase** + a hot-path `insert`→`upsert` change. | Migration `013`: `CREATE UNIQUE INDEX … ON transactions (recurring_id, date) WHERE recurring_id IS NOT NULL`; switch the generator to `upsert(…, { onConflict: 'recurring_id,date', ignoreDuplicates: true })`. (Carried over from `RECENT_FEATURE_AUDIT.md`.) |
| R-3 | **Recurring "resume" doesn't immediately backfill** — a resumed rule catches up only on next app load (create backfills immediately). | Low | Product/UX decision. | Call `generateDueTransactions` when `is_active` flips to `true`. |
| R-4 | **Recurring update/delete rely on RLS for ownership** (`services/recurring.ts` filters by `id` only). | Low | Safe today (migration 011 RLS enforces `auth.uid() = user_id`); changing it is defense-in-depth only. | Add `.eq('user_id', …)` to match the categories/transactions services. |
| R-5 | **Pre-existing, out of scope:** migrations 002 & 003 both `CREATE INDEX IF NOT EXISTS idx_user_categories_active`, so 003's `(user_id, type)` variant is silently skipped. | Low | Unrelated to any audited feature; touching old migrations has ordering implications. | Rename 003's index in a follow-up migration. |

*No memory leaks, infinite renders, broken loading states, or broken navigation were found. Timer-based code (`useDebouncedValue`, generator mount hook) cleans up on unmount; contexts unsubscribe; optimistic mutations roll back on error.*

---

## Verification appendix

```
eslint .                              # 0 errors, 6 pre-existing warnings
tsc -b                                # clean (app)
tsc -p tests/tsconfig.json --noEmit   # clean (tests)
vite build                            # clean (~0.34s)
vitest run                            # 98 files / 1224 tests / 0 failing
```

### Files changed
- `src/hooks/useDebouncedValue.ts` *(new)* — reusable debounce hook
- `src/pages/TransactionsPage.tsx` — debounce search feeding the query
- `src/services/loans.ts` — local disbursement date via `getToday()`
- `src/hooks/useAccounts.ts` — invalidate dashboard + analytics on account delete
- `tests/hooks/useDebouncedValue.test.tsx` *(new, +4)*
- `tests/services/loans.test.ts` *(+1)*
- `tests/hooks/useAccounts.test.tsx` *(+1)*

