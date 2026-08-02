# RECENT_FEATURE_AUDIT.md

**Audit type:** Full regression audit of recently-added features
**Date:** 2026-08-02
**Auditor role:** Senior Software QA Engineer
**Build/commit state:** working tree at time of audit

---

## Scope — Features Tested

| # | Feature | Surface reviewed |
|---|---------|------------------|
| 1 | **Recurring Transactions** | `recurring_transactions` table (migration `011`), `services/recurring.ts` (CRUD + `generateDueTransactions` + pure `planDueOccurrences`), `hooks/useRecurringTransactions.ts`, `RecurringForm`, `RecurringList`, `RecurringPage`, 🔁 badge, `recurring_id` linkage |
| 2 | **Transactions Hub** | `layouts/TransactionsLayout.tsx` (All · Recurring · Loans sub-tabs) |
| 3 | **Nested Routes** | `routes/index.tsx` — nested `/transactions/*`, legacy `/recurring` & `/loans` redirects, in-hub `*` fallback, breadcrumb longest-prefix matching |
| 4 | **Inline Category Creation** | "+ New category" panel in `TransactionForm` **and** `RecurringForm` |
| 5 | **Category Soft Delete** | `deleteUserCategory` (sets `deleted_at`), `getUserCategories` filter, FK-join resolution for historical rows |
| 6 | **Partial Unique Index** | migration `012` — `uniq_user_categories_active_name_type … WHERE deleted_at IS NULL` |
| 7 | **Friendly Duplicate Validation** | `useCreateCategory` 23505 → neutral toast (no throw / no false success) |

### Cross-feature interactions verified

Authentication · Transactions · Multi-Accounts · Dashboard · Analytics · CSV Import · CSV Export · Search · Filters · Sorting · Profile · Currency Formatting.

Key findings from the interaction review:

- **CSV Export** (`generateCSV`) — generated recurring transactions are ordinary `transactions` rows, so they flow through export with no special-casing. `recurring_id` is intentionally not exported (internal link).
- **CSV Import** (`CSVImportModal`) — unaffected by the new features: it writes `account_id: null` (so it correctly does **not** need to invalidate the accounts cache) and never sets `recurring_id`. Category matching is by name+type against the merged list, which already excludes soft-deleted categories.
- **Analytics / Dashboard / Search / Filters / Sorting** — all read the same normalized `transactions` (with `categories`, `account`, `amount`, `date`, `type`), so generated rows and inline-created categories participate everywhere. Historical rows whose category was soft-deleted still resolve their name/color via the FK join (`TRANSACTION_SELECT` has no `deleted_at` filter), keeping analytics breakdowns stable while the pickers correctly hide deleted categories.
- **Multi-Accounts** — recurring rules carry `account_id`; recurring mutations invalidate the accounts cache so balances refresh after generation. `ON DELETE SET NULL` keeps rules/txns intact when an account is deleted.
- **Currency / Profile** — `RecurringList` formats amounts via `useCurrency()`, consistent with the rest of the app.
- **Authentication** — the generator runs per-user, ref-guarded, and all recurring queries are `enabled: !!user`; `recurring_transactions` has full per-user RLS (migration `011`).

---

## Test Results

| Gate | Command | Result |
|------|---------|--------|
| Lint | `eslint .` | ✅ **0 errors**, 6 warnings (all pre-existing `watch()` / React-Compiler "incompatible-library" in `LoanForm`/`RecurringForm`/`TransactionForm`) |
| Typecheck (app) | `tsc -b` | ✅ clean |
| Typecheck (tests) | `tsc -p tests/tsconfig.json --noEmit` | ✅ clean |
| Build | `vite build` | ✅ built in ~0.35s; Recurring/Loans/Transactions all code-split into lazy chunks |
| Unit + Integration | `vitest run` | ✅ **97 files / 1218 tests / 0 failing** |
| Coverage | `vitest run --coverage` | ✅ `COVERAGE_EXIT=0` |

### Coverage snapshot (after audit)

| Metric | Overall |
|--------|---------|
| Statements | **75.57%** |
| Branches | **67.35%** |
| Functions | **73.18%** |
| Lines | **78.47%** |

---

## Bugs Found

**No new production bugs were found in this regression pass.** The recently-added code paths behaved correctly across every audited interaction seam. The substantive defects were already caught and fixed in the preceding per-feature audits (summarized below under *Bugs Fixed* for traceability).

One **quality gap** was found and fixed in this pass:

| ID | Severity | Finding |
|----|----------|---------|
| G-1 | Low (test gap) | `src/pages/RecurringPage.tsx` had **0% coverage** — no test file existed. The page was functionally correct but its render states and `handleCreate` submit-wiring were unguarded against regressions. |

---

## Bugs Fixed

### This pass
- **G-1** — Added `tests/pages/RecurringPage.test.tsx` (6 tests): loading skeleton, error state, empty state, list rendering, header, and the create-submit wiring (mapped payload → `useCreateRecurringTransaction`). Coverage for `RecurringPage.tsx`: **0% → 63.6% stmts / 85.7% branch**. Safe, additive change (no production code touched).

### Fixed in preceding audits (traceability)
| Feature | Bug | Fix |
|---------|-----|-----|
| Recurring | `normalizeTransaction` silently dropped `recurring_id`, so the 🔁 badge could never render | mapped `recurring_id` in the normalizer; +regression tests |
| Nested routes | Unknown `/transactions/*` bounced out to `/dashboard` | added in-hub `*` → `/transactions` fallback; +tests |
| Inline category | Unhandled promise rejection on a failed create (`void mutateAsync`) | wrapped in try/catch, panel stays open for retry; +tests |
| Soft delete / uniqueness | Re-creating a soft-deleted category name hit `user_categories_user_id_name_type_key` | migration `012` partial unique index; friendly toast in `useCreateCategory`; +DB-contract & integration tests |

---

## Coverage Impact

| Item | Before | After | Δ |
|------|--------|-------|---|
| Test files | 96 | **97** | +1 |
| Tests | 1212 | **1218** | +6 |
| Overall statements | 75.33% | **75.57%** | +0.24 |
| Overall branches | 66.87% | **67.35%** | +0.48 |
| `src/pages` statements | 68.22% | **70.56%** | +2.34 |
| `RecurringPage.tsx` statements | 0% | **63.6%** | +63.6 |

---

## Remaining Risks

| # | Risk | Severity | Likelihood | Notes / Recommended action |
|---|------|----------|------------|----------------------------|
| R-1 | **Duplicate generated transactions** under concurrency or partial failure. There is no DB-level `UNIQUE(recurring_id, date)` guard. If two browser tabs run the generator simultaneously, or if the transaction `INSERT` succeeds but the subsequent rule-cursor `UPDATE` fails, the same occurrence(s) can be inserted twice. | Medium | Low | In-app it's mitigated (single-threaded JS + per-user `ranForUser` ref-guard on mount), so it's unlikely in normal single-tab use. **Recommended fix:** migration adding `CREATE UNIQUE INDEX … ON transactions (recurring_id, date) WHERE recurring_id IS NOT NULL`, and switch the generator's `.insert()` to `.upsert(…, { onConflict: 'recurring_id,date', ignoreDuplicates: true })`. Not auto-applied — it's a schema migration you must run in Supabase plus a hot-path change; worth doing before moving generation server-side. |
| R-2 | **Resume doesn't immediately backfill.** Creating a rule generates any due occurrence immediately, but toggling a paused rule back to active only backfills on the next app load. | Low | Med | Minor UX inconsistency. Optionally call `generateDueTransactions` in `useUpdateRecurringTransaction` when `is_active` flips to `true`. |
| R-3 | **Editing `frequency` doesn't recompute `next_due_date`.** The stored cursor keeps its date; the new cadence applies from the next occurrence onward. | Low | Low | Currently a reasonable product default. Document, or recompute the cursor from `start_date` on frequency change if stricter behavior is desired. |
| R-4 | **Recurring update/delete rely on RLS for ownership** (`services/recurring.ts` filters by `id` only, not `user_id`). | Low | Low | Safe today because migration `011` RLS enforces `auth.uid() = user_id`. Adding `.eq('user_id', …)` would match the defense-in-depth used by the categories service. |
| R-5 | **Client-side generation only runs when the app is opened** (by design, for Supabase free tier). | Low | n/a | If guaranteed timeliness is needed, move `generateDueTransactions` to a scheduled Edge Function + `pg_cron` (no schema change required; pairs well with R-1's unique index). |
| R-6 | **Pre-existing, out of scope:** migrations `002` and `003` both `CREATE INDEX IF NOT EXISTS idx_user_categories_active` under the same name, so `003`'s `(user_id, type)` variant is silently skipped. | Low | n/a | Unrelated to the audited features. Rename `003`'s index in a follow-up migration if desired. |

*No race conditions, stale-cache issues, incorrect analytics, broken navigation, or duplicate records were observed in normal single-client operation. Cache invalidation is comprehensive: recurring mutations invalidate recurring + transactions + dashboard + accounts + analytics; category create invalidates the whole `['categories']` prefix.*

### Accessibility / Mobile / UI consistency
- **A11y:** pause/resume/edit/delete controls have `aria-label`s; the hub tab bar uses an accessible nav with `aria-current` on the active tab. No violations found in the reviewed components.
- **Mobile:** the hub tab bar is horizontally scrollable (`overflow-x-auto`, `whitespace-nowrap`, `touch-manipulation`); `RecurringList` cards use responsive padding and truncation; the sidebar is 2 items shorter after the hub restructure. No overflow/tap-target issues found.
- **UI consistency:** inline "+ New category" is identical across `TransactionForm` and `RecurringForm`; empty/error/loading states match the app's shared components.

---

## Production Readiness Score

### **92 / 100 — Ready for production**

**Rationale:** All quality gates are green (lint, typecheck, build, 1218 tests, coverage export succeeds). The recently-added features are correct across every audited interaction seam, and the previously-identified defects are fixed and regression-tested. Points withheld are almost entirely for **R-1** (the absence of a DB-level idempotency guard on generated transactions), which is low-likelihood in single-tab use but is the one item worth hardening before scaling generation or moving it server-side, plus the minor polish items R-2/R-3/R-4.

**Recommended before/soon after release:**
1. Apply the `UNIQUE(recurring_id, date)` guard + `upsert ignoreDuplicates` (R-1).
2. Decide the intended resume/backfill semantics (R-2) and frequency-edit cursor behavior (R-3).
3. Optionally add `.eq('user_id')` to recurring update/delete for defense-in-depth (R-4).

---

### Verification appendix (commands run)
```
eslint .                                  # 0 errors, 6 pre-existing warnings
tsc -b                                    # clean
tsc -p tests/tsconfig.json --noEmit       # clean
vite build                                # clean
vitest run --coverage                     # 97 files / 1218 tests / 0 failing; COVERAGE_EXIT=0
```

