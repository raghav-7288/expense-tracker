# ExpenseTracker — Project Context

> Updated 2026-07-13 | ~8,000+ source lines | [https://expense-tracker-raghav.vercel.app/](https://expense-tracker-raghav.vercel.app/)

---

## Project Overview

A modern personal finance SPA for tracking income/expenses, managing categories, visualizing spending with 20+ interactive charts, and providing AI-generated financial insights. Built with React 19, TypeScript, Supabase, Framer Motion, and deployed on Vercel.

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
| Animations | framer-motion | ^12.42.2 |
| Icons | lucide-react | ^1.24.0 |
| Toasts | react-hot-toast | ^2.6.0 |
| Testing | vitest + @testing-library/react | ^4.1.10 |
| Lint | eslint | ^10.6.0 |

## Folder Structure

```
src/
├── components/
│   ├── analytics/           # 20+ chart/analysis components
│   │   ├── ChartCard.tsx
│   │   ├── SummaryGrid.tsx
│   │   ├── TimeRangeFilter.tsx
│   │   ├── IncomeVsExpenseChart.tsx
│   │   ├── ExpenseTrendChart.tsx
│   │   ├── CashFlowChart.tsx
│   │   ├── DailySpendingChart.tsx
│   │   ├── WeeklySpendingChart.tsx
│   │   ├── MonthlySpendingChart.tsx
│   │   ├── CategoryPieChart.tsx
│   │   ├── CategoryComparisonChart.tsx
│   │   ├── SavingsTrendChart.tsx
│   │   ├── TopCategories.tsx
│   │   ├── LargestTransactions.tsx
│   │   ├── ExpenseHeatmap.tsx
│   │   ├── FinancialHealthCard.tsx
│   │   ├── SmartInsights.tsx
│   │   ├── SpendingPatterns.tsx
│   │   ├── MonthlyReport.tsx
│   │   ├── YearlyReport.tsx
│   │   ├── CategoryBreakdownTable.tsx
│   │   ├── ExportButton.tsx
│   │   └── AnalyticsSkeleton.tsx
│   ├── auth/
│   │   ├── GoogleSignInButton.tsx
│   │   └── ProtectedRoute.tsx
│   ├── categories/
│   │   ├── CategoryForm.tsx
│   │   └── CategoryList.tsx
│   ├── dashboard/
│   │   ├── CategoryChart.tsx
│   │   ├── MonthlyChart.tsx
│   │   ├── RecentTransactions.tsx
│   │   └── StatCard.tsx
│   ├── transactions/
│   │   ├── TransactionFilters.tsx
│   │   ├── TransactionForm.tsx
│   │   └── TransactionList.tsx
│   └── ui/
│       ├── AnimatedPage.tsx
│       ├── Avatar.tsx
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── ConfirmDialog.tsx
│       ├── Divider.tsx
│       ├── Dropdown.tsx
│       ├── EmptyState.tsx
│       ├── ErrorState.tsx
│       ├── FormAlert.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── PageHeader.tsx
│       ├── SectionHeader.tsx
│       ├── Select.tsx
│       ├── Skeleton.tsx
│       ├── Spinner.tsx
│       ├── StatusDot.tsx
│       └── TextArea.tsx
├── context/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── engines/
│   └── analytics.ts          # Pure computation (850+ lines)
├── hooks/
│   ├── useAnalytics.ts
│   ├── useAuth.tsx
│   ├── useCategories.ts
│   ├── useCurrency.ts
│   ├── useDashboard.ts
│   ├── useProfile.ts
│   ├── useTheme.ts
│   └── useTransactions.ts
├── layouts/
│   ├── AuthLayout.tsx
│   └── DashboardLayout.tsx
├── lib/
│   ├── queryClient.ts
│   ├── queryKeys.ts
│   └── supabase.ts
├── pages/
│   ├── AnalyticsPage.tsx
│   ├── CategoriesPage.tsx
│   ├── DashboardPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── LoginPage.tsx
│   ├── ProfilePage.tsx
│   ├── ResetPasswordPage.tsx
│   ├── SignUpPage.tsx
│   └── TransactionsPage.tsx
├── routes/
│   └── index.tsx
├── services/
│   ├── categories.ts
│   ├── profiles.ts
│   └── transactions.ts
├── styles/
│   ├── design-system.ts      # Design tokens reference
│   └── index.css             # Tailwind + dark mode (410+ lines)
├── test/
│   ├── factories.ts
│   ├── mocks/supabase.ts
│   ├── setup.ts
│   └── test-utils.tsx
├── types/
│   ├── analytics.ts
│   └── index.ts
├── utils/
│   ├── animations.ts         # Framer Motion variants
│   ├── cn.ts
│   ├── constants.ts
│   ├── formatCurrency.ts
│   └── formatDate.ts
├── App.tsx
└── main.tsx
tests/                         # 54 test files, 321 tests
```

## Routing

| Path | Component | Protected |
| ---- | --------- | --------- |
| `/login` | LoginPage | ❌ |
| `/signup` | SignUpPage | ❌ |
| `/forgot-password` | ForgotPasswordPage | ❌ |
| `/reset-password` | ResetPasswordPage | ❌ |
| `/dashboard` | DashboardPage | ✅ |
| `/analytics` | AnalyticsPage | ✅ |
| `/transactions` | TransactionsPage | ✅ |
| `/categories` | CategoriesPage | ✅ |
| `/profile` | ProfilePage | ✅ |
| `*` | Navigate → /dashboard | — |

## Data Models

| Model | Key Fields | Table |
| ----- | ---------- | ----- |
| Profile | id, email, full_name, currency, avatar_url | `profiles` |
| Category | id, user_id, name, type, color, icon | `categories` |
| Transaction | id, user_id, category_id, type, amount, description, date, notes | `transactions` |

All tables use UUID primary keys, `created_at`/`updated_at` timestamps, and Row Level Security.

## State Management

| What | Where | Key/Pattern |
| ---- | ----- | ----------- |
| Auth (user, session) | React Context | `AuthContext` |
| Theme (dark mode) | React Context + localStorage | `expense-tracker-dark-mode` |
| Server data | TanStack Query cache | `queryKeys.*` |
| Auth session tokens | Supabase managed (localStorage) | `expense-tracker-auth` |
| Form state | React Hook Form (local) | per-form instance |
| Analytics filters | useState (page-local) | AnalyticsPage |

## Authentication

| Method | Implementation |
| ------ | ------------- |
| Email/Password | `supabase.auth.signInWithPassword()` |
| Google OAuth | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| Password Reset | `supabase.auth.resetPasswordForEmail()` |
| Session | Auto-refresh, persisted in localStorage |

## Key Architecture Decisions

1. **Client-side SPA** — No SSR; auth app behind login. Supabase RLS handles authorization.
2. **TanStack Query for server state** — Caching, background refetch, optimistic updates.
3. **Analytics Engine (pure functions)** — `src/engines/analytics.ts` computes all analytics client-side from cached transaction data. No extra API calls.
4. **Framer Motion for animations** — AnimatePresence on modals, stagger on cards, page transitions.
5. **Design System** — `src/styles/design-system.ts` documents all tokens; CSS overrides for dark mode.
6. **Services return `{ data, error }`** — Never throw from service layer.
7. **One hook fetches all, engine computes** — `useAnalytics` fetches all transactions once, uses `useMemo` for 15+ derived computations.
8. **Responsive: mobile-first** — Bottom-sheet modals on mobile, proper table on desktop, horizontal-scroll filters.
9. **Default currency: INR** — Configurable per user in profile settings.
10. **Skeleton loading** — Every data-fetching view has a matching skeleton (no spinners).

## Scripts

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "preview": "vite preview",
  "verify-supabase": "node scripts/verify-supabase.js",
  "context": "node scripts/generate-context.js"
}
```

## Deployment

| Setting | Value |
| ------- | ----- |
| Platform | Vercel |
| Install | `yarn install --no-lockfile` |
| Build | `yarn run build` |
| Output | `dist` |
| SPA routing | `vercel.json` rewrites |
| Caching | `public/_headers` (assets immutable, HTML no-cache) |
| Node | 22.x (via `engines` in package.json) |

## Testing

| Metric | Value |
| ------ | ----- |
| Framework | Vitest 4 + React Testing Library + jsdom |
| Test files | 54 |
| Tests | 321 passing |
| Services coverage | 100% |
| Utils coverage | 100% |
| Hooks coverage | 85%+ |
| UI components coverage | 90%+ |

