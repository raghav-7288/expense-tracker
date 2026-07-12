# ExpenseTracker — Project Context

> Auto-generated on 2026-07-12 | 4,619 source lines | [https://expense-tracker-raghav.vercel.app/](https://expense-tracker-raghav.vercel.app/)

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
│   └── architecture-decisions.md
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── scripts/
│   └── generate-context.js
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx
│   │   ├── categories/
│   │   │   ├── CategoryForm.tsx
│   │   │   └── CategoryList.tsx
│   │   ├── dashboard/
│   │   │   ├── CategoryChart.tsx
│   │   │   ├── MonthlyChart.tsx
│   │   │   ├── RecentTransactions.tsx
│   │   │   └── StatCard.tsx
│   │   ├── layout/
│   │   ├── pages/
│   │   ├── transactions/
│   │   │   ├── TransactionFilters.tsx
│   │   │   ├── TransactionForm.tsx
│   │   │   └── TransactionList.tsx
│   │   ├── ui/
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── TextArea.tsx
│   │   └── ErrorBoundary.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── data/
│   ├── engines/
│   ├── hooks/
│   │   ├── useAuth.tsx
│   │   ├── useCategories.ts
│   │   ├── useDashboard.ts
│   │   ├── useProfile.ts
│   │   ├── useTheme.ts
│   │   └── useTransactions.ts
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   └── DashboardLayout.tsx
│   ├── lib/
│   │   ├── queryClient.ts
│   │   ├── queryKeys.ts
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── CategoriesPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   ├── SignUpPage.tsx
│   │   └── TransactionsPage.tsx
│   ├── routes/
│   │   └── index.tsx
│   ├── services/
│   │   ├── categories.ts
│   │   ├── profiles.ts
│   │   └── transactions.ts
│   ├── stores/
│   ├── styles/
│   │   └── index.css
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── constants.ts
│   │   ├── formatCurrency.ts
│   │   └── formatDate.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── CLAUDE.md
├── eslint.config.js
├── expense-tracker.iml
├── index.html
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
| `src/App.tsx` | 32 | App (default) |
| `src/lib/supabase.ts` | 21 | supabase |
| `src/lib/queryClient.ts` | 13 | queryClient |
| `src/lib/queryKeys.ts` | 27 | queryKeys |
| `src/context/AuthContext.tsx` | 78 | AuthContextType, AuthContext, AuthProvider (default) |
| `src/context/ThemeContext.tsx` | 29 | ThemeContext, ThemeProvider (default) |
| `src/hooks/useAuth.tsx` | 15 | useAuth |
| `src/hooks/useTheme.ts` | 12 | useTheme |
| `src/hooks/useTransactions.ts` | 110 | useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction |
| `src/hooks/useCategories.ts` | 105 | useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory |
| `src/hooks/useProfile.ts` | 43 | useProfile, useUpdateProfile |
| `src/hooks/useDashboard.ts` | 159 | useDashboardStats, useRecentTransactions, useMonthlyData, useCategoryBreakdown |
| `src/services/transactions.ts` | 101 | getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction, getMonthlyStats |
| `src/services/categories.ts` | 49 | getCategories, createCategory, updateCategory, deleteCategory |
| `src/services/profiles.ts` | 25 | getProfile, updateProfile |
| `src/routes/index.tsx` | 47 | AppRouter (default) |
| `src/layouts/AuthLayout.tsx` | 45 | AuthLayout (default) |
| `src/layouts/DashboardLayout.tsx` | 143 | DashboardLayout (default) |
| `src/pages/DashboardPage.tsx` | 82 | DashboardPage (default) |
| `src/pages/TransactionsPage.tsx` | 97 | TransactionsPage (default) |
| `src/pages/CategoriesPage.tsx` | 105 | CategoriesPage (default) |
| `src/pages/ProfilePage.tsx` | 188 | ProfilePage (default) |
| `src/pages/LoginPage.tsx` | 88 | LoginPage (default) |
| `src/pages/SignUpPage.tsx` | 105 | SignUpPage (default) |
| `src/pages/ForgotPasswordPage.tsx` | 91 | ForgotPasswordPage (default) |
| `src/pages/ResetPasswordPage.tsx` | 83 | ResetPasswordPage (default) |
| `src/components/auth/ProtectedRoute.tsx` | 28 | ProtectedRoute (default) |
| `src/components/ui/Button.tsx` | 48 | Button (default) |
| `src/components/ui/Input.tsx` | 43 | Input (default) |
| `src/components/ui/Modal.tsx` | 83 | Modal (default) |
| `src/components/ui/Card.tsx` | 24 | Card (default) |
| `src/components/ui/Skeleton.tsx` | 77 | SkeletonCard, SkeletonTable, Skeleton (default) |
| `src/components/ui/ErrorState.tsx` | 34 | ErrorState (default) |
| `src/components/ErrorBoundary.tsx` | 51 | ErrorBoundary (default) |
| `src/types/index.ts` | 108 | TransactionType, Profile, Category, Transaction, CreateTransactionInput, UpdateTransactionInput, CreateCategoryInput, UpdateCategoryInput, UpdateProfileInput, TransactionFilters, DashboardStats, MonthlyData, CategoryBreakdown |
| `src/utils/cn.ts` | 7 | cn |
| `src/utils/formatCurrency.ts` | 22 | formatCurrency, formatCompactCurrency |
| `src/utils/formatDate.ts` | 37 | formatDate, formatDateShort, getToday, getMonthStart, getMonthEnd, getMonthName |
| `src/utils/constants.ts` | 25 | CATEGORY_COLORS, CATEGORY_ICONS, CURRENCIES |

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
| lucide-react | ^1.24.0 |
| react | ^19.2.7 |
| react-dom | ^19.2.7 |
| react-hook-form | ^7.56.0 |
| react-hot-toast | ^2.6.0 |
| react-router-dom | ^7.18.1 |
| recharts | ^3.9.2 |
| tailwindcss | ^4.3.2 |
| zod | ^4.4.3 |

### Dev

| Package | Version |
| ------- | ------- |
| @eslint/js | ^10.0.1 |
| @types/node | ^24.13.2 |
| @types/react | ^19.2.17 |
| @types/react-dom | ^19.2.3 |
| @vitejs/plugin-react | ^6.0.3 |
| eslint | ^10.6.0 |
| eslint-plugin-react-hooks | ^7.1.1 |
| eslint-plugin-react-refresh | ^0.5.3 |
| globals | ^17.7.0 |
| typescript | ~6.0.2 |
| typescript-eslint | ^8.62.0 |
| vite | ^8.1.1 |

## Testing

No test framework configured yet. Recommended: Vitest + React Testing Library.

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

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

