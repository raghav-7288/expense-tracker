# Test Summary — Regression Suite

**Date:** August 2, 2026
**Engineer:** Senior Test Automation (audit)
**Scope:** Full regression run + coverage hardening of recently-shipped features
(Recurring Transactions, Transactions Hub, inline category creation, category
soft-delete) and their cross-feature interactions.

---

## 1. Gate Results

| Gate | Command | Result |
| ---------------- | ------------------------------- | ------------------------------------ |
| Lint | `eslint .` | ✅ 0 errors, 0 warnings |
| Typecheck (app) | `tsc -b` | ✅ 0 errors |
| Typecheck (tests)| `tsc -p tests/tsconfig.json` | ✅ 0 errors |
| Build | `vite build` | ✅ clean, no warnings (~0.34s) |
| Unit + integration | `vitest run` | ✅ **101 files / 1272 passing / 0 failing** |
| Coverage | `vitest run --coverage` | ✅ generated (v8) |

---

## 2. Coverage

### Overall (before → after)

| Metric | Before | After | Δ |
| ---------- | ------ | ------ | ------- |
| Statements | 77.63% | **82.13%** | +4.50 |
| Branches | 68.89% | **72.44%** | +3.55 |
| Functions | 76.19% | **80.75%** | +4.56 |
| Lines | 80.64% | **85.03%** | +4.39 |

### High-impact files hardened

| File | Stmts before → after | Lines after |
| ------------------------------------- | -------------------- | ----------- |
| `src/hooks/useRecurringTransactions.ts` | 22.22% → **95.83%** | 100% |
| `src/hooks/useTransactions.ts` | 55.69% → **98.73%** | 100% |
| `src/services/recurring.ts` | 58.06% → **91.12%** | 98.05% |
| `src/hooks/` (directory) | 75.83% → **91.18%** | 96.66% |

---

## 3. Bug Fixed

**`RecurringList.test.tsx` — income-rule amount assertion (failing test).**
The Net-amount `<span>` renders the sign and the formatted amount as two adjacent
text nodes, so Testing Library's `getNodeText` returns the concatenation
(`+$5,000.00`). The income test asserted the unsigned `$5,000.00` and failed,
while the sibling expense test correctly asserted `-$1,200.00`. Corrected the
income assertion to `+$5,000.00` (matching how the component actually renders,
consistent with the expense case) and documented why. No production code changed.

---

## 4. Files Tested / Tests Added (+36 net)

| Test file | Added | What it now covers |
| ------------------------------------------------ | ----- | ------------------------------------------------------------------ |
| `tests/hooks/useRecurringTransactions.test.tsx` **(new)** | +15 | Full lifecycle of the recurring hooks: list query (auth / no-user / error), create (+ immediate `generateDueTransactions`, invalidation fan-out, error toast), update (success/error), **optimistic delete + rollback**, and the mount-time generator (`useGenerateDueTransactions`): once-per-user, singular/plural toast, silent-when-zero, error-swallow, no-run-when-unauthenticated. |
| `tests/services/recurring.test.ts` | +12 | CRUD + normalization: `getRecurringTransactions` (system vs user category join, account join, error passthrough), `createRecurringTransaction` (**system→`system_category_id`**, **fallback→`user_category_id`**, null-category no-lookup, cursor/`is_active` seeding, error), `updateRecurringTransaction` (partial-field update, category resolution, error), `deleteRecurringTransaction` (hard-delete by id, error). |
| `tests/hooks/useTransactions.test.tsx` | +9 | "Not authenticated" create guard, update-error toast, **optimistic delete cache removal + rollback**, and both loan-linked hooks: `useUpdateLoanTransaction` (loan-id passthrough, error) and `useDeleteLoanTransaction` (repayment vs disbursement toasts, optimistic removal + rollback). |

**Total: 1236 → 1272 tests (+36).**

---

## 5. Cross-Feature Interactions Verified

| Interaction | Where covered |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| **Transactions + Recurring** | `useRecurringTransactions` create path calls `generateDueTransactions`; generator inserts ordinary `transactions` rows with `recurring_id`; invalidation refreshes transactions/dashboard/accounts/analytics. |
| **Transactions + Accounts** | Loan-transaction hooks + delete invalidation fan-out (accounts + loans) — `useTransactions.test.tsx`. |
| **Transactions + Categories** | Recurring create/update resolves a category id into the correct system/user FK column — `recurring.test.ts`. |
| **Analytics + Filters** | Pre-existing `analytics` engine + `AnalyticsPage`/filter suites (unchanged, still green). |
| **CSV Import + Export** | Pre-existing `regression/csv-export` + import suites (unchanged, still green). |
| **Profile + Currency** | Pre-existing `useCurrency`/`ProfilePage` suites (100% on `useCurrency`, unchanged). |

Happy paths, error paths, edge cases (month-end, leap year, end-date, safety cap,
idempotent replay), empty/loading states, and optimistic-cache rollback are all
exercised.

---

## 6. Remaining Gaps (candidates for a future pass)

Ordered by value. None are regressions; all are pre-existing low-coverage areas.

| File | Stmts | Note |
| ----------------------------------------- | ------ | ------------------------------------------------------------------ |
| `src/services/transactions.ts` | 49.64% | Uncovered: **loan-transaction service internals** (lines 250–391) — `updateLoanTransaction`/`deleteLoanTransaction` loan-recalc logic. The *hooks* are now covered; the service math is not. Highest-value next target. |
| `src/components/transactions/ImportModal.tsx` | 11.42% | CSV import parsing/column-mapping UI — complex, largely untested. |
| `src/components/analytics/ExportButton.tsx` | 14.28% | Thin export trigger; low risk. |
| `src/pages/LoansPage.tsx` | 46.66% | Page-level branches (modals, empty/error states). |
| `src/pages/TransactionsPage.tsx` | 46.66% | Debounced-search + filter branches (lines 61–180). |
| `src/pages/AnalyticsPage.tsx` | 56.52% | Chart-section conditionals. |
| `src/components/transactions/TransactionFilters.tsx` | 57.5% | Filter-control branches. |

**Recommended next step:** unit-test `updateLoanTransaction` / `deleteLoanTransaction`
in `services/transactions.ts` (the loan `outstanding_amount`/status recalculation),
which is the largest remaining logic gap and complements the hook tests added here.

---

## 7. Verdict

All hard gates pass with zero errors/warnings and **1272 green tests**. Coverage on
the recently-shipped surface — the item most at risk of regression — moved from
partial to near-complete (recurring hook 22%→96%, transactions hook 56%→99%,
recurring service 58%→91%). No production behavior was changed; the one failing
test was an incorrect assertion, now corrected.

