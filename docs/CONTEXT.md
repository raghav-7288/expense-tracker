# ExpenseTracker — Project Context

> Auto-generated on 2026-08-02 | 34,260 source lines | [https://expense-tracker-raghav.vercel.app/](https://expense-tracker-raghav.vercel.app/)

---

## Project Overview

A modern personal finance app for tracking income and expenses, managing categories, and visualizing spending with interactive charts. Built with React 19, TypeScript, Supabase, and deployed on Vercel.

## Tech Stack

| Layer | Technology | Version |
| ----- | ---------- | ------- |
| Framework | react | ^19.2.7 |
| Language | typescript | ~6.0.2 |
| Build | vite | ^8.1.1 |
| Styling | tailwindcss | ^4.3.2 |
| Server State | @tanstack/react-query | ^5.75.0 |
| Forms | react-hook-form | ^7.56.0 |
| Validation | zod | ^4.4.3 |
| Routing | react-router-dom | ^7.18.1 |
| Backend/Auth | @supabase/supabase-js | ^2.110.2 |
| Charts | recharts | ^3.9.2 |
| Icons | lucide-react | ^1.24.0 |
| Toasts | react-hot-toast | ^2.6.0 |
| Lint | eslint | ^10.6.0 |

## Folder Structure

```
expensetracker/
├── docs/
│   ├── reports/
│   │   ├── BUG_REPORT.md
│   │   ├── DATABASE_AUDIT.md
│   │   ├── DATABASE_PRODUCTION_AUDIT.md
│   │   ├── FUNCTIONAL_AUDIT.md
│   │   ├── IMPROVEMENTS.md
│   │   ├── PRODUCTION_AUDIT.md
│   │   ├── README.md
│   │   ├── RECENT_FEATURE_AUDIT.md
│   │   ├── RELEASE_CHECKLIST.md
│   │   ├── SUGGESTIONS.md
│   │   ├── TEST_SUMMARY.md
│   │   ├── UI_PERFORMANCE_REPORT.md
│   │   └── UI_UX_AUDIT.md
│   ├── screenshots/
│   ├── ai-insights-suggestions.md
│   ├── architecture-decisions.md
│   ├── CLAUDE.md
│   ├── CONTEXT.md
│   ├── DATABASE_SETUP.md
│   ├── DEPLOYMENT.md
│   ├── INSTALLATION.md
│   └── README.md
├── public/
│   ├── _headers
│   ├── _redirects
│   ├── favicon.svg
│   └── icons.svg
├── scripts/
│   ├── generate-context.js
│   └── verify-supabase.js
├── src/
│   ├── components/
│   │   ├── accounts/
│   │   │   └── AccountForm.tsx
│   │   ├── analytics/
│   │   │   ├── AnalyticsSkeleton.tsx
│   │   │   ├── CashFlowChart.tsx
│   │   │   ├── CategoryBreakdownTable.tsx
│   │   │   ├── CategoryComparisonChart.tsx
│   │   │   ├── CategoryFilter.tsx
│   │   │   ├── CategoryPieChart.tsx
│   │   │   ├── ChartCard.tsx
│   │   │   ├── DailySpendingChart.tsx
│   │   │   ├── ExpenseHeatmap.tsx
│   │   │   ├── ExpenseTrendChart.tsx
│   │   │   ├── ExportButton.tsx
│   │   │   ├── FinancialHealthCard.tsx
│   │   │   ├── IncomeVsExpenseChart.tsx
│   │   │   ├── InvestmentTracker.tsx
│   │   │   ├── LargestTransactions.tsx
│   │   │   ├── MonthlyReport.tsx
│   │   │   ├── MonthlySpendingChart.tsx
│   │   │   ├── SavingsTrendChart.tsx
│   │   │   ├── SmartInsights.tsx
│   │   │   ├── SpendingPatterns.tsx
│   │   │   ├── SummaryGrid.tsx
│   │   │   ├── TimeRangeFilter.tsx
│   │   │   ├── TopCategories.tsx
│   │   │   ├── WeeklySpendingChart.tsx
│   │   │   └── YearlyReport.tsx
│   │   ├── auth/
│   │   │   ├── ChangePasswordForm.tsx
│   │   │   ├── GoogleSignInButton.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── categories/
│   │   │   ├── CategoryForm.tsx
│   │   │   └── CategoryList.tsx
│   │   ├── dashboard/
│   │   │   ├── AccountBalances.tsx
│   │   │   ├── CategoryChart.tsx
│   │   │   ├── MonthlyChart.tsx
│   │   │   ├── RecentTransactions.tsx
│   │   │   └── StatCard.tsx
│   │   ├── loans/
│   │   │   ├── LoanFilterBar.tsx
│   │   │   ├── LoanForm.tsx
│   │   │   ├── LoanList.tsx
│   │   │   ├── LoanSummaryCard.tsx
│   │   │   └── RepaymentForm.tsx
│   │   ├── recurring/
│   │   │   ├── RecurringForm.tsx
│   │   │   └── RecurringList.tsx
│   │   ├── transactions/
│   │   │   ├── CSVImportModal.tsx
│   │   │   ├── TransactionFilters.tsx
│   │   │   ├── TransactionForm.tsx
│   │   │   └── TransactionList.tsx
│   │   ├── ui/
│   │   │   ├── AnimatedPage.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── Divider.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   ├── FormAlert.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── SectionHeader.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── StatusDot.tsx
│   │   │   └── TextArea.tsx
│   │   └── ErrorBoundary.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── engines/
│   │   └── analytics.ts
│   ├── hooks/
│   │   ├── useAccounts.ts
│   │   ├── useAnalytics.ts
│   │   ├── useAuth.tsx
│   │   ├── useCategories.ts
│   │   ├── useCurrency.ts
│   │   ├── useDashboard.ts
│   │   ├── useDebouncedValue.ts
│   │   ├── useLoans.ts
│   │   ├── useProfile.ts
│   │   ├── useRecurringTransactions.ts
│   │   ├── useTheme.ts
│   │   └── useTransactions.ts
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── TransactionsLayout.tsx
│   ├── lib/
│   │   ├── queryClient.ts
│   │   ├── queryKeys.ts
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── AccountsPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── CategoriesPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── LoansPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── RecurringPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   ├── SignUpPage.tsx
│   │   └── TransactionsPage.tsx
│   ├── routes/
│   │   └── index.tsx
│   ├── services/
│   │   ├── accounts.ts
│   │   ├── categories.ts
│   │   ├── loans.ts
│   │   ├── profiles.ts
│   │   ├── recurring.ts
│   │   └── transactions.ts
│   ├── styles/
│   │   ├── design-system.ts
│   │   └── index.css
│   ├── test/
│   │   ├── mocks/
│   │   │   └── supabase.ts
│   │   ├── factories.ts
│   │   ├── setup.ts
│   │   └── test-utils.tsx
│   ├── types/
│   │   ├── analytics.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── animations.ts
│   │   ├── cn.ts
│   │   ├── constants.ts
│   │   ├── formatCurrency.ts
│   │   └── formatDate.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_category_system.sql
│       ├── 003_audit_fixes.sql
│       ├── 004_fix_transaction_category_fk.sql
│       ├── 005_add_investment_expense_category.sql
│       ├── 006_merge_description_into_notes.sql
│       ├── 007_accounts.sql
│       ├── 008_performance_functions.sql
│       ├── 009_loans_schema.sql
│       ├── 010_audit_followups.sql
│       ├── 011_recurring_transactions.sql
│       └── 012_fix_user_category_unique.sql
├── tests/
│   ├── components/
│   │   ├── accounts/
│   │   │   └── AccountForm.test.tsx
│   │   ├── analytics/
│   │   │   ├── analytics-regression.test.tsx
│   │   │   ├── category-filter-comprehensive.test.tsx
│   │   │   ├── CategoryFilter.test.tsx
│   │   │   ├── ChartCard.test.tsx
│   │   │   ├── charts.test.tsx
│   │   │   ├── FinancialHealthCard.test.tsx
│   │   │   ├── InvestmentTracker.test.tsx
│   │   │   ├── SmartInsights.test.tsx
│   │   │   ├── SummaryGrid.test.tsx
│   │   │   └── TimeRangeFilter.test.tsx
│   │   ├── auth/
│   │   │   ├── ChangePasswordForm.test.tsx
│   │   │   ├── GoogleSignInButton.test.tsx
│   │   │   └── ProtectedRoute.test.tsx
│   │   ├── categories/
│   │   │   ├── CategoryForm.test.tsx
│   │   │   └── CategoryList.test.tsx
│   │   ├── dashboard/
│   │   │   ├── AccountBalances.test.tsx
│   │   │   ├── CategoryChart.test.tsx
│   │   │   ├── MonthlyChart.test.tsx
│   │   │   ├── RecentTransactions.test.tsx
│   │   │   └── StatCard.test.tsx
│   │   ├── loans/
│   │   │   └── LoanList.test.tsx
│   │   ├── recurring/
│   │   │   ├── RecurringForm.test.tsx
│   │   │   └── RecurringList.test.tsx
│   │   ├── transactions/
│   │   │   ├── TransactionFilters.test.tsx
│   │   │   ├── TransactionForm.test.tsx
│   │   │   └── TransactionList.test.tsx
│   │   ├── ui/
│   │   │   ├── Badge.test.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Card.test.tsx
│   │   │   ├── ConfirmDialog.test.tsx
│   │   │   ├── Dropdown.test.tsx
│   │   │   ├── EmptyState.test.tsx
│   │   │   ├── ErrorState.test.tsx
│   │   │   ├── Input.test.tsx
│   │   │   ├── Modal.test.tsx
│   │   │   ├── PageHeader.test.tsx
│   │   │   ├── Select.test.tsx
│   │   │   ├── Skeleton.test.tsx
│   │   │   ├── Spinner.test.tsx
│   │   │   ├── StatusDot.test.tsx
│   │   │   └── TextArea.test.tsx
│   │   └── ErrorBoundary.test.tsx
│   ├── context/
│   │   ├── AuthContext.integration.test.tsx
│   │   ├── AuthContext.test.tsx
│   │   └── ThemeContext.test.tsx
│   ├── engines/
│   │   ├── analytics-loans.test.ts
│   │   ├── analytics.test.ts
│   │   └── category-filter-analytics.test.ts
│   ├── hooks/
│   │   ├── useAccounts.test.tsx
│   │   ├── useAnalytics.test.tsx
│   │   ├── useAuth.test.tsx
│   │   ├── useCategories.test.tsx
│   │   ├── useCurrency.test.tsx
│   │   ├── useDashboard.test.tsx
│   │   ├── useDebouncedValue.test.tsx
│   │   ├── useLoans.test.tsx
│   │   ├── useProfile.test.tsx
│   │   ├── useRecurringTransactions.test.tsx
│   │   ├── useTheme.test.tsx
│   │   └── useTransactions.test.tsx
│   ├── integration/
│   │   ├── category-soft-delete-uniqueness.test.tsx
│   │   ├── loan-badges-list.test.tsx
│   │   ├── loan-badges-recent.test.tsx
│   │   ├── loan-dashboard-widgets.test.tsx
│   │   ├── loan-summary-card.test.tsx
│   │   ├── loans-flow.test.tsx
│   │   └── transactions-hub-routing.test.tsx
│   ├── layouts/
│   │   ├── AuthLayout.test.tsx
│   │   ├── DashboardLayout.test.tsx
│   │   └── TransactionsLayout.test.tsx
│   ├── lib/
│   │   └── queryKeys.test.ts
│   ├── pages/
│   │   ├── AccountsPage.test.tsx
│   │   ├── AnalyticsPage.test.tsx
│   │   ├── CategoriesPage.test.tsx
│   │   ├── DashboardPage.test.tsx
│   │   ├── ForgotPasswordPage.test.tsx
│   │   ├── LoansPage.test.tsx
│   │   ├── LoginPage.test.tsx
│   │   ├── ProfilePage.test.tsx
│   │   ├── RecurringPage.test.tsx
│   │   ├── ResetPasswordPage.test.tsx
│   │   ├── SignUpPage.test.tsx
│   │   └── TransactionsPage.test.tsx
│   ├── regression/
│   │   ├── bug-hunt-2.test.ts
│   │   ├── category-filter.test.tsx
│   │   ├── csv-export.test.ts
│   │   ├── error-handling.test.tsx
│   │   └── modal-stability.test.tsx
│   ├── services/
│   │   ├── accounts.test.ts
│   │   ├── categories.test.ts
│   │   ├── loans-e2e.test.ts
│   │   ├── loans.test.ts
│   │   ├── profiles.test.ts
│   │   ├── recurring.test.ts
│   │   └── transactions.test.ts
│   ├── utils/
│   │   ├── cn.test.ts
│   │   ├── constants.test.ts
│   │   ├── formatCurrency.test.ts
│   │   └── formatDate.test.ts
│   ├── App.test.tsx
│   └── tsconfig.json
├── CHANGELOG.md
├── CONTRIBUTING.md
├── eslint.config.js
├── expense-tracker.iml
├── index.html
├── LICENSE
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
└── vite.config.ts
```

## File Map & Exports

| File | Lines | Exports |
| ---- | ----- | ------- |
| `src/main.tsx` | 15 | — |
| `src/App.tsx` | 61 | App (default) |
| `src/lib/supabase.ts` | 21 | supabase |
| `src/lib/queryClient.ts` | 14 | queryClient |
| `src/lib/queryKeys.ts` | 49 | queryKeys |
| `src/context/AuthContext.tsx` | 99 | AuthContextType, AuthContext, AuthProvider (default) |
| `src/context/ThemeContext.tsx` | 37 | ThemeContext, ThemeProvider (default) |
| `src/hooks/useAuth.tsx` | 15 | useAuth |
| `src/hooks/useTheme.ts` | 12 | useTheme |
| `src/hooks/useTransactions.ts` | 192 | useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction, useUpdateLoanTransaction, useDeleteLoanTransaction |
| `src/hooks/useCategories.ts` | 211 | useCategories, useHiddenCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useHideCategory, useRestoreCategory, useCopyCategory |
| `src/hooks/useProfile.ts` | 44 | useProfile, useUpdateProfile |
| `src/hooks/useDashboard.ts` | 139 | useDashboardStats, useRecentTransactions, useMonthlyData, useCategoryBreakdown |
| `src/services/transactions.ts` | 394 | getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction, getMonthlyStats, BalanceSummary, getBalanceSummary, updateLoanTransaction, deleteLoanTransaction |
| `src/services/categories.ts` | 266 | getSystemCategories, getUserCategories, getHiddenCategories, getMergedCategories, createUserCategory, updateUserCategory, deleteUserCategory, hideSystemCategory, restoreSystemCategory, copySystemCategory, getHiddenSystemCategories |
| `src/services/profiles.ts` | 31 | getProfile, updateProfile |
| `src/routes/index.tsx` | 78 | AppRouter (default) |
| `src/layouts/AuthLayout.tsx` | 45 | AuthLayout (default) |
| `src/layouts/DashboardLayout.tsx` | 233 | DashboardLayout (default) |
| `src/pages/DashboardPage.tsx` | 177 | DashboardPage (default) |
| `src/pages/TransactionsPage.tsx` | 215 | TransactionsPage (default) |
| `src/pages/CategoriesPage.tsx` | 170 | CategoriesPage (default) |
| `src/pages/ProfilePage.tsx` | 257 | ProfilePage (default) |
| `src/pages/LoginPage.tsx` | 100 | LoginPage (default) |
| `src/pages/SignUpPage.tsx` | 123 | SignUpPage (default) |
| `src/pages/ForgotPasswordPage.tsx` | 102 | ForgotPasswordPage (default) |
| `src/pages/ResetPasswordPage.tsx` | 91 | ResetPasswordPage (default) |
| `src/components/auth/ProtectedRoute.tsx` | 28 | ProtectedRoute (default) |
| `src/components/ui/Button.tsx` | 60 | Button (default) |
| `src/components/ui/Input.tsx` | 64 | Input (default) |
| `src/components/ui/Modal.tsx` | 129 | Modal (default) |
| `src/components/ui/Card.tsx` | 23 | Card (default) |
| `src/components/ui/Skeleton.tsx` | 236 | SkeletonCard, SkeletonTable, SkeletonChart, SkeletonPieChart, SkeletonProfile, SkeletonCategoryGrid, SkeletonRecentTransactions, Skeleton (default) |
| `src/components/ui/ErrorState.tsx` | 33 | ErrorState (default) |
| `src/components/ErrorBoundary.tsx` | 51 | ErrorBoundary (default) |
| `src/types/index.ts` | 337 | TransactionType, AccountType, Profile, Category, SystemCategory, UserCategory, MergedCategory, CategorySource, Account, CreateAccountInput, UpdateAccountInput, TransactionLoanInfo, Transaction, CreateTransactionInput, UpdateTransactionInput, RecurrenceFrequency, RecurringTransactionType, RecurringTransaction, CreateRecurringTransactionInput, UpdateRecurringTransactionInput, CreateCategoryInput, UpdateCategoryInput, HiddenCategory, CategoryFilter, UpdateProfileInput, TransactionFilters, DashboardStats, MonthlyData, CategoryBreakdown, LoanType, LoanStatus, LoanEventType, Loan, CreateLoanInput, UpdateLoanInput, LoanTransaction, RecordRepaymentInput, LoanFilters, LoanSummary |
| `src/utils/cn.ts` | 7 | cn |
| `src/utils/formatCurrency.ts` | 20 | formatCurrency, formatCompactCurrency |
| `src/utils/formatDate.ts` | 47 | formatDate, formatDateShort, getToday, getMonthStart, getMonthEnd, getMonthName |
| `src/utils/constants.ts` | 38 | CATEGORY_COLORS, CATEGORY_ICONS, CURRENCIES |

## Routing

| Path | Component | Protected | Lazy |
| ---- | --------- | --------- | ---- |
| `/login` | LoginPage | ❌ | ❌ |
| `/signup` | SignUpPage | ❌ | ❌ |
| `/forgot-password` | ForgotPasswordPage | ❌ | ❌ |
| `/reset-password` | ResetPasswordPage | ❌ | ❌ |
| `/dashboard` | DashboardPage | ✅ | ❌ |
| `/transactions` | TransactionsPage | ✅ | ❌ |
| `/categories` | CategoriesPage | ✅ | ❌ |
| `/profile` | ProfilePage | ✅ | ❌ |
| `*` | Navigate → /dashboard | ❌ | ❌ |

## Data Models

| Model | Key Fields | Table |
| ----- | ---------- | ----- |
| Profile | id, email, full_name, currency, avatar_url | `profiles` |
| Category | id, user_id, name, type, color, icon | `categories` |
| Transaction | id, user_id, category_id, type, amount, description, date, notes | `transactions` |

All tables use UUID primary keys, `created_at`/`updated_at` timestamps, and Row Level Security (users only access own data).

## State Management

| What | Where | Key/Pattern |
| ---- | ----- | ----------- |
| Auth (user, session) | React Context | `AuthContext` |
| Theme (dark mode) | React Context + localStorage | `expense-tracker-dark-mode` |
| Server data (transactions, categories, profile, dashboard) | TanStack Query cache | `queryKeys.*` |
| Auth session tokens | Supabase managed (localStorage) | `expense-tracker-auth` |
| Form state | React Hook Form (local) | per-form instance |

## Environment Variables

| Variable | Purpose | Required |
| -------- | ------- | -------- |
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | ✅ |

## Scripts

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "verify-supabase": "node scripts/verify-supabase.js",
  "context": "node scripts/generate-context.js"
}
```

## Dependencies

### Production

| Package | Version |
| ------- | ------- |
| @hookform/resolvers | ^5.0.1 |
| @supabase/supabase-js | ^2.110.2 |
| @tailwindcss/vite | ^4.3.2 |
| @tanstack/react-query | ^5.75.0 |
| clsx | ^2.1.1 |
| framer-motion | ^12.42.2 |
| lucide-react | ^1.24.0 |
| react | ^19.2.7 |
| react-dom | ^19.2.7 |
| react-hook-form | ^7.56.0 |
| react-hot-toast | ^2.6.0 |
| react-is | ^19.2.7 |
| react-router-dom | ^7.18.1 |
| recharts | ^3.9.2 |
| tailwindcss | ^4.3.2 |
| zod | ^4.4.3 |

### Dev

| Package | Version |
| ------- | ------- |
| @eslint/js | ^10.0.1 |
| @testing-library/dom | ^10.4.1 |
| @testing-library/jest-dom | ^6.9.1 |
| @testing-library/react | ^16.3.2 |
| @testing-library/user-event | ^14.6.1 |
| @types/node | ^24.13.2 |
| @types/react | ^19.2.17 |
| @types/react-dom | ^19.2.3 |
| @vitejs/plugin-react | ^6.0.3 |
| @vitest/coverage-v8 | ^4.1.10 |
| eslint | ^10.6.0 |
| eslint-plugin-react-hooks | ^7.1.1 |
| eslint-plugin-react-refresh | ^0.5.3 |
| globals | ^17.7.0 |
| jsdom | ^29.1.1 |
| typescript | ~6.0.2 |
| typescript-eslint | ^8.62.0 |
| vite | ^8.1.1 |
| vitest | ^4.1.10 |

## Testing

- **Framework:** Vitest (recommended)
- **Test files:** 101
- **Run:** `npm test`

## Deployment

| Setting | Value |
| ------- | ----- |
| Platform | Vercel |
| Framework | Vite (auto-detected) |
| Build command | `npm run build` |
| Output directory | `dist` |
| SPA routing | `vercel.json` rewrite → `/index.html` |
| Environment vars | Set in Vercel dashboard |

## Design Decisions

1. **Client-side SPA** — No SSR needed; auth app behind login. Supabase RLS handles authorization.
2. **TanStack Query for server state** — Caching, background refetch, optimistic updates, automatic invalidation.
3. **React Context for auth & theme** — Needed before TanStack Query hydrates; available on public routes.
4. **Services return `{ data, error }`** — Consistent with Supabase client pattern; never throw from service layer.
5. **Centralized query keys** — `src/lib/queryKeys.ts` factory prevents key drift and enables precise invalidation.
6. **Optimistic deletes** — Transactions/categories removed from cache immediately; rolled back on error.
7. **Dark mode via body class** — CSS overrides with `body.dark-mode` + localStorage persistence + FOUC prevention script.
8. **Zod for runtime validation** — Single source of truth for form rules; types derived with `z.infer<>`.
9. **One component per file** — PascalCase filename = default export name.
10. **`@/` path alias** — All imports from `src/` use this; configured in tsconfig + vite.

