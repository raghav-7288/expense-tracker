# ExpenseTracker — Project Context

> **Audience:** AI agents and new engineers. This is a **hand-maintained** narrative
> of how the app is built and why. It complements the **auto-generated**
> [`CONTEXT.md`](./CONTEXT.md) (produced by `npm run context`, which contains a
> file map, export list, and dependency snapshot). If you add a major feature,
> **update this file** — do not edit `CONTEXT.md` by hand (it is overwritten).

---

## Project Overview

ExpenseTracker is a personal finance SPA for tracking income and expenses, managing
categories and accounts, scheduling recurring transactions, tracking loans (money
lent/borrowed), setting per-category budgets, and visualizing spending through 20+
analytics charts. It is a client-side React app backed by Supabase (Postgres + Auth +
Row Level Security). There is no custom backend server — the browser talks to Supabase
directly, and **RLS is the authorization boundary**.

- **Frontend:** React 19 + TypeScript 6 (strict) + Vite 8
- **Backend:** Supabase (Postgres, Auth, RLS, RPC functions)
- **Deploy:** Vercel (static SPA build, `dist/`)

---

## Current Architecture

**Provider tree** (`src/main.tsx` → `src/App.tsx`):

```
StrictMode
└─ QueryClientProvider (TanStack Query)
   └─ ThemeProvider (dark mode via React Context + localStorage)
      └─ AuthProvider (Supabase session via React Context)
         ├─ ErrorBoundary
         │  └─ AppRouter (React Router 7, BrowserRouter)
         └─ AppToaster (react-hot-toast, theme-aware)
```

**Layering (one direction — UI never calls Supabase directly):**

```
pages / components
   └─ hooks/           React Query wrappers (useX) — cache, invalidation, toasts
        └─ services/   Supabase data access — returns { data, error }, never throws
             └─ lib/supabase.ts  (single Supabase client)
engines/   pure business logic (analytics), no I/O
utils/     pure helpers (formatCurrency, formatDate, cn)
```

**State model:**

| Concern | Mechanism |
|---|---|
| Server data (transactions, categories, accounts, loans, recurring, dashboard, analytics) | TanStack React Query cache |
| Auth session/user | `AuthContext` (React Context) |
| Theme (dark mode) | `ThemeContext` + `localStorage` |
| Form state | React Hook Form (local, per form) |

> **There is no Zustand** in this project despite older docs mentioning it. Global
> state is React Query (server) + React Context (auth/theme) only.

**Routing** (`src/routes/index.tsx`) — all app pages are lazy-loaded:

- Public (under `AuthLayout`): `/login`, `/signup`, `/forgot-password`, `/reset-password`
- Protected (under `ProtectedRoute` → `DashboardLayout`):
  - `/dashboard`, `/analytics`, `/accounts`, `/categories`, `/profile`
  - `/analytics` renders two tabs selected by a `?tab=` query param: **Insights** (default)
    and **Budgets** (`?tab=budgets`)
  - `/transactions` is a **hub** (`TransactionsLayout`) with nested tabs:
    - index → All transactions
    - `recurring` → Recurring
    - `loans` → Loans
    - `*` → redirect back to `/transactions` (stays in hub)
  - Legacy redirects: `/recurring` → `/transactions/recurring`, `/loans` → `/transactions/loans`,
    `/budgets` → `/analytics?tab=budgets`
- Catch-all `*` → `/dashboard`

**Sidebar** (`DashboardLayout`) has 5 items: Dashboard, Analytics, Transactions,
Accounts, Categories (Recurring & Loans live inside the Transactions hub). Breadcrumb
titles use **longest-prefix matching** so `/transactions/loans` shows "Loans".

---

## Folder Structure

```
src/
├── components/
│   ├── accounts/      # account list, form, cards
│   ├── analytics/     # chart & insight components
│   ├── auth/          # auth forms, Google sign-in, ProtectedRoute
│   ├── budgets/       # BudgetForm, BudgetsPanel
│   ├── categories/    # category list, form, management
│   ├── dashboard/     # StatCard, charts, AccountBalances, BudgetProgressWidget
│   ├── loans/         # loan list, form, repayment, summary card
│   ├── recurring/     # RecurringList, RecurringForm
│   ├── transactions/  # TransactionList, TransactionForm, filters, CSVImportModal
│   ├── ui/            # reusable primitives (Button, Modal, Input, Select, …)
│   └── ErrorBoundary.tsx
├── context/           # AuthContext, ThemeContext
├── engines/           # analytics.ts (pure computation + CSV generation)
├── hooks/             # React Query wrappers + useAuth/useTheme/useCurrency/useDebouncedValue/useBudgetAlerts
├── layouts/           # AuthLayout, DashboardLayout, TransactionsLayout
├── lib/               # supabase.ts, queryClient.ts, queryKeys.ts
├── pages/             # lazy-loaded route components
├── routes/            # AppRouter
├── services/          # accounts, budgets, categories, loans, profiles, recurring, transactions
├── styles/            # index.css (design tokens + dark-mode overrides)
├── test/              # setup + renderWithProviders
├── types/             # index.ts (all shared types)
└── utils/             # cn, constants, formatCurrency, formatDate, animations
supabase/migrations/   # 001–013 SQL migrations
tests/                 # mirrors src/ structure
```

---

## Database Schema Overview

11 tables (RLS on all). Migrations `001`–`013` in `supabase/migrations/`.

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | `id`, `email`, `full_name`, `currency`, `avatar_url` | 1:1 with `auth.users` |
| `system_categories` | `id`, `name`, `type`, `color`, `icon` | Global, immutable |
| `user_categories` | `id`, `user_id`, `name`, `type`, `color`, `icon`, `source_category_id`, `deleted_at` | Soft delete; `source_category_id` links a copied system category |
| `user_hidden_categories` | `user_id`, `category_id` | Hides a system category for a user |
| `transactions` | `id`, `user_id`, `type`, `amount`, `notes`, `date`, `account_id`, `system_category_id`, `user_category_id`, `recurring_id` | `type` ∈ income/expense/lent/borrowed |
| `accounts` | `id`, `user_id`, `name`, `type`, `initial_balance`, `is_active`, `sort_order` | Opt-in |
| `loans` | `id`, `user_id`, `counterparty_name`, `type`, `principal_amount`, `outstanding_amount`, `status`, `due_date` | `type` ∈ lent/borrowed |
| `loan_transactions` | `loan_id`, `transaction_id`, `event_type` | `event_type` ∈ disbursement/repayment |
| `recurring_transactions` | `id`, `user_id`, template fields, `frequency`, `start_date`, `end_date`, `next_due_date`, `is_active` | Rule rows |
| `budgets` | `id`, `user_id`, `category_id`, `category_source`, `amount`, `period`, `alert_threshold`, `is_active` | `period` ∈ weekly/monthly; `category_source` ∈ system/user |
| `categories` (legacy) | — | Retained from `001` for back-compat; app uses system/user categories |

**Foreign keys of note:**
- `transactions.account_id` → `accounts.id` `ON DELETE SET NULL`
- `transactions.recurring_id` → `recurring_transactions.id` `ON DELETE SET NULL`
- `loan_transactions` cascades from both `loans` and `transactions`

**RPC functions (`008_performance_functions.sql`):**
- `get_balance_summary(uid)` → `total_income`, `total_expenses`, `monthly_income`, `monthly_expenses`
- `get_account_balances(uid)` → each active account + `computed_balance`
- `pg_trgm` GIN index on `transactions.notes` for fast search

**Uniqueness (`012`):** `user_categories` uses a **partial** unique index
`(user_id, name, type) WHERE deleted_at IS NULL` so a soft-deleted name can be reused.

**Uniqueness (`013`):** `budgets` has `UNIQUE(user_id, category_id, category_source, period)`
— a category can have at most one budget per period; a duplicate raises `23505`, surfaced
by `useCreateBudget` as a friendly "already exists" toast.

---

## Authentication Flow

1. `AuthContext` subscribes to `supabase.auth` and exposes `{ user, session, loading }`.
2. `ProtectedRoute` redirects to `/login` when there is no session.
3. Email/password + Google OAuth; password reset via `/forgot-password` → `/reset-password`.
4. Session tokens are managed by Supabase in `localStorage`.
5. Every service query is user-scoped and further enforced by **RLS** (`auth.uid() = user_id`).

---

## Transaction Flow

1. `TransactionForm` (React Hook Form + Zod) collects type, amount, notes, date,
   category, account. Categories can be created **inline** (see below).
2. `useTransactions` mutations call `services/transactions.ts`.
3. The service resolves the merged `category_id` into `system_category_id` **or**
   `user_category_id`, inserts/updates, and returns `{ data, error }`.
4. Reads use `TRANSACTION_SELECT` (joins categories + account + loan info) and
   `normalizeTransaction` flattens the joins into one `Transaction` object
   (including `recurring_id` and a merged `categories`).
5. Deletes are **optimistic** (removed from cache immediately, rolled back on error).
6. Filters/sort/search are encoded into the React Query key; **search is debounced**
   (`useDebouncedValue`) at the query boundary.

---

## Recurring Transaction Flow

1. A rule lives in `recurring_transactions` (template fields + `frequency`,
   `start_date`, `end_date`, `next_due_date`, `is_active`). Only **income/expense** can recur.
2. Create a rule from the Add Transaction form ("Repeat this transaction") or the
   Recurring tab (`RecurringForm`). `next_due_date` seeds to `start_date`.
3. **Generation is client-side** (`generateDueTransactions`), triggered once per user
   on app-shell mount (`useGenerateDueTransactions`, ref-guarded) and right after
   creating a rule.
4. `planDueOccurrences` is a **pure** scheduling core: it computes which dates are due
   (catching up any missed while the app was closed), the new cursor, and whether the
   rule is still active. Dates are **anchored on `start_date`** via `nthOccurrence`, so
   month-end and leap-day schedules never drift (Jan 31 → Feb 28 → Mar 31; Feb 29 → Feb 29
   next leap year). A safety cap (`MAX_OCCURRENCES_PER_RULE = 366`) prevents runaway loops.
5. Generated transactions are ordinary `transactions` rows with `recurring_id` set — a
   🔁 badge renders in the list. Deleting a rule keeps generated rows (FK is `SET NULL`).
6. Pause/resume toggles `is_active`; paused rules are excluded from the generator query.

---

## Multi-Account Flow

1. Accounts are **opt-in**; `transactions.account_id` is nullable.
2. `useAccounts` + `services/accounts.ts` do CRUD; balances come from the
   `get_account_balances` RPC (`initial_balance + Σincome − Σexpense` per account).
3. Deleting an account sets `account_id = NULL` on its transactions (they survive), so
   `useDeleteAccount` also invalidates dashboard + analytics caches.

---

## Loan Flow

1. A loan (`loans`) records a counterparty, `type` (lent/borrowed), `principal_amount`,
   `outstanding_amount`, and `status` (active → partially_paid → settled).
2. Creating a loan also creates a **disbursement** transaction (`type` lent/borrowed),
   linked via `loan_transactions`.
3. Recording a repayment (`RecordRepaymentInput`) creates a **repayment** transaction and
   decrements `outstanding_amount`; status flips to `partially_paid` or `settled`.
4. Loan (lent/borrowed) transactions are **excluded** from income/expense charts.
5. The Dashboard shows a `LoanSummaryCard` linking into the hub.

---

## Budget Flow

1. A budget (`budgets`) sets a spending limit (`amount`) on one category
   (`category_id` + `category_source`) over a `period` (`weekly` or `monthly`), with an
   `alert_threshold` (default `0.80`).
2. `useBudgets` + `services/budgets.ts` do CRUD; `getBudgetProgress` computes each budget's
   progress by summing **expense** transactions in the current period window
   (`getMonthStart/End` or `getWeekStart/End`) for that category.
3. Progress yields `spent`, `remaining`, `percentage`, and a `status`:
   `on_track` → `warning` (≥ `alert_threshold`) → `exceeded` (≥ 100%).
4. `useBudgetProgress` refetches every 5 min; `useBudgetAlerts` (mounted once in
   `DashboardLayout`) fires a warning/exceeded **toast** the first time each budget reaches a
   new status per session (ref-guarded so it doesn't re-toast on refetch/re-render).
5. Budgets surface in two places: the **Budgets tab** of `/analytics`
   (`BudgetsPanel` + `BudgetVsActualChart`) and a **`BudgetProgressWidget`** on the Dashboard
   (top budgets by urgency). There is no dedicated page or sidebar item.
6. Only **expense** spending counts toward a budget; income and loan transactions are ignored.

---

## Analytics Flow

1. `useAnalytics` fetches the user's transactions once; `engines/analytics.ts` (pure)
   computes all derived series (trends, cash flow, heatmap, health score, insights, etc.).
2. Because the engine is pure and I/O-free, it is exhaustively unit-testable.
3. Filters (date range, type, category) are applied before/within the engine; charts
   are Recharts components.
4. `AnalyticsPage` splits its content into two tabs driven by a `?tab=` query param:
   **Insights** (all the charts above) and **Budgets** (`BudgetsPanel` + `BudgetVsActualChart`).

---

## CSV Import / Export Flow

- **Export:** `generateCSV` (analytics engine) serializes transactions to CSV. Generated
  and loan transactions are ordinary rows, so they export with no special-casing.
- **Import:** `CSVImportModal` (in `components/transactions/`) parses a CSV, validates rows,
  and bulk-inserts via the transactions service (invalidating transactions, accounts, and
  budgets caches afterward).

---

## Shared Components

UI primitives in `src/components/ui/` (reuse these — do not hand-roll):
`AnimatedPage`, `Avatar`, `Badge`, `Button`, `Card`, `ConfirmDialog`, `Divider`,
`Dropdown`, `EmptyState`, `ErrorState`, `FormAlert`, `Input`, `Modal`, `PageHeader`,
`SectionHeader`, `Select`, `Skeleton`, `Spinner`, `StatusDot`, `TextArea`.
Plus `components/ErrorBoundary.tsx`.

---

## Shared Hooks

`src/hooks/`: `useAuth`, `useTheme`, `useCurrency`, `useDebouncedValue`,
`useTransactions`, `useRecurringTransactions`, `useCategories`, `useAccounts`,
`useLoans`, `useBudgets` (+ `useBudgetProgress`), `useBudgetAlerts`, `useProfile`,
`useDashboard`, `useAnalytics`.
Data hooks are thin React Query wrappers that own cache keys, invalidation, and toasts.

---

## Shared Services

`src/services/` (all return `{ data, error }`, never throw): `transactions`,
`recurring`, `categories`, `accounts`, `loans`, `budgets`, `profiles`. The Supabase client is
`src/lib/supabase.ts`; query keys are centralized in `src/lib/queryKeys.ts`.

---

## Design System

- **Tailwind CSS v4** utility classes; `cn()` (clsx wrapper) for conditional classes.
- **Dark mode** is implemented in `src/styles/index.css` via `body.dark-mode [class*="…"]`
  overrides (not per-element `dark:` variants). Toggling adds/removes `dark-mode` on
  `<body>`; preference persists in `localStorage`; an inline script prevents FOUC.
  **When adding UI, verify it in both themes** — but you usually rely on the global
  overrides rather than adding `dark:` classes.
- Lucide React icons; react-hot-toast for transient notifications (theme-aware in `App.tsx`).
- Skeletons, empty states, and error states exist for every data view.

---

## Business Rules

- **Dashboard total balance** = `Σ income − Σ expenses` over **all** user transactions
  (`get_balance_summary`), independent of accounts.
- **Per-account balance** = `initial_balance + Σ income − Σ expenses` for that account
  (`get_account_balances`); only income/expense affect it. Account-less transactions
  count toward the dashboard total but toward **no** account balance (see Known Limitations).
- **Recurring generation** is anchored on `start_date`, catches up missed occurrences,
  deactivates after `end_date`, and is capped at 366 occurrences per run.
- **Category ownership:** system categories are global/immutable; user categories are
  per-user and **soft-deleted** (`deleted_at`). The UI shows a merged list.
- **Category duplicates:** a live duplicate `(user_id, name, type)` raises Postgres
  `23505`; `useCreateCategory` catches it and shows a **friendly toast** (returns `null`,
  no error/success toast). After migration `012`, `23505` can only mean a *live* duplicate.
- **Currency:** stored on `profiles.currency`; `formatCurrency(amount, currency)` is
  always called with the user's currency (via `useCurrency`). Never hardcode a symbol.
- **Analytics filtering** excludes loan (lent/borrowed) transactions from income/expense series.
- **Budgets** track **expense** spending only, within the current weekly/monthly period window.
  Status is `on_track` → `warning` (≥ `alert_threshold`, default 80%) → `exceeded` (≥ 100%).
  At most one budget per `(category, category_source, period)`; a duplicate raises `23505`,
  surfaced as a friendly toast. Budget alerts are **in-app toasts**, fired once per status
  change per browser session.
- **Soft delete:** deleting a user category hides it from pickers but historical
  transactions keep their label (the FK join does not filter `deleted_at`).
- **RLS assumption:** the client trusts Postgres RLS for authorization; every table
  enforces `auth.uid() = user_id`. Never rely on client-side checks for security.

---

## Coding Standards

- **TypeScript strict; no `any`.** Derive types from Zod with `z.infer<>` where validating.
- **`@/` path alias** for all `src/` imports.
- **Function declarations** for components (not arrow consts).
- **Services return `{ data, error }`** — never throw from the service layer.
- **One component per file**; PascalCase filename = default export.
- **React Query** for all server state; centralize keys in `queryKeys.ts`; invalidate by
  prefix so related views refresh together.
- **Optimistic updates** for deletes (with rollback).
- **Reuse** existing `ui/` primitives, hooks, utils, and constants before creating new ones.
- **Forms:** React Hook Form + Zod resolver; use `useWatch({ control, name })` (not `watch()`)
  so React Compiler can optimize.

---

## Testing Strategy

- **Vitest 4 + React Testing Library + jsdom.** Tests live in `tests/`, mirroring `src/`.
- Setup: `src/test/setup.ts`; shared `renderWithProviders` wraps Query/Theme/Auth.
- Supabase and hooks are mocked at the module boundary; services are tested against a
  mocked client; the analytics engine and recurring scheduler are tested as pure functions.
- Current status: **104 test files · 1,409 passing · ~79% statement / ~81% line coverage.**
- Run: `npm test`, `npm run test:coverage`, `npm run test:watch`.
- **Add tests for every new feature and every fixed bug** (regression test pinning the bug).

---

## Performance Optimizations

- **Route-level code splitting** — every page is `React.lazy`.
- **Vendor chunking** (`vite.config.ts` `manualChunks`) splits react, router, query,
  supabase, charts (recharts), motion, forms, icons into cacheable chunks — entry bundle
  is ~49.6 kB (14.3 kB gzip); recharts/framer-motion are off the first-paint path.
- **`React.memo`** on propless dashboard subtrees (`MonthlyChart`, `CategoryChart`, `StatCard`).
- **Server-side aggregation RPCs** avoid full transaction fetches for balances.
- **React Query config:** 5 min stale, 15 min gc, no refetch-on-focus.
- **Budget progress** polls every 5 min (`refetchInterval`) so status/alerts stay current.
- **Debounced search** avoids a query per keystroke.

---

## Important Dependencies

| Package | Why |
|---|---|
| `@supabase/supabase-js` | Postgres + Auth + RLS client (the entire backend) |
| `@tanstack/react-query` | Server-state cache, invalidation, optimistic updates |
| `react-hook-form` + `zod` + `@hookform/resolvers` | Forms + runtime validation + inferred types |
| `react-router-dom` | Client-side routing, nested hub routes, redirects |
| `recharts` | All analytics/dashboard charts |
| `react-is` | **Required peer dependency of recharts** — do not remove |
| `framer-motion` | Page transitions/animations |
| `lucide-react` | Icon set |
| `react-hot-toast` | Transient notifications (theme-aware) |
| `clsx` | Conditional class composition (`cn`) |
| `tailwindcss` (v4) + `@tailwindcss/vite` | Styling |

---

## Known Limitations

- **Recurring generation is client-side** — occurrences only materialize when a user
  opens the app. A server-side scheduler (Edge Function + `pg_cron`) is the planned upgrade.
- **No `UNIQUE(recurring_id, date)` guard** — duplicate generation is prevented in
  practice (single-threaded JS + ref guard), not by the schema. Add the constraint +
  `upsert` before moving generation server-side.
- **Balance semantics:** account-less transactions are in the dashboard total but in no
  per-account balance — a product decision, documented here so it isn't "fixed" blindly.
- **Budget progress is computed client-side** — `getBudgetProgress` fetches the period's
  expense transactions and sums them per category in JS (fine for personal-finance volumes).
  Budget alerts are in-app toasts only and reset each browser session (no push/email).
- **Legacy `categories` table** from `001` still exists; the app uses system/user categories.
- **Duplicate index name** `idx_user_categories_active` is created in both `002` and `003`
  (`IF NOT EXISTS` makes `003` silently skip) — latent perf nit, not a correctness bug.
- **Security headers** in `public/_headers` are a Netlify/Cloudflare convention and are
  **not** applied on Vercel (Vercel reads headers from `vercel.json`, which — per project
  rules — must not be modified). RLS + Supabase Auth remain the data-protection layer.

---

## AI Agent Guidelines

- **Reuse** existing components, hooks, services, and utils — never duplicate logic.
- **Follow the existing architecture:** UI → hooks → services → Supabase; keep pure logic
  in `engines/`/`utils/`.
- **Maintain strict TypeScript** (no `any`); derive form types from Zod.
- **Keep dark/light parity** — verify new UI in both themes (rely on the global dark-mode
  overrides in `styles/index.css`).
- **Services return `{ data, error }`** — never throw; surface errors via toasts in hooks.
- **Centralize query keys** and invalidate by prefix.
- **Add tests for every new feature and every bug fix.**
- **Do not modify `vercel.json`** (locked by project rules).
- **Do not hand-edit `docs/CONTEXT.md`** (auto-generated). **Do update this file
  (`docs/PROJECT_CONTEXT.md`) whenever a major feature is added or an architectural
  decision changes.**

