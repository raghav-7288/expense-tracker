# CLAUDE.md — Expense Tracker

> AI-assistant instructions for working in this repository.
> Read this file at the start of every session.

## Project Overview

**ExpenseTracker** is a personal finance app that lets users track income and expenses, manage categories, and visualize spending. It is a client-side React SPA backed by Supabase (Postgres + Auth).

**Stage:** Implemented — full working application with authentication, CRUD for transactions/categories, dashboard with charts, and profile management.

---

## Tech Stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Framework     | React 19 (with JSX transform)               |
| Language      | TypeScript 6 (strict mode)                  |
| Build         | Vite 8                                      |
| Styling       | Tailwind CSS v4 (`@tailwindcss/vite` plugin)|
| Server State  | TanStack Query 5                            |
| Forms         | React Hook Form 7 + Zod 4                   |
| Routing       | React Router 7 (`react-router-dom`)         |
| Validation    | Zod 4                                       |
| Backend/Auth  | Supabase (Postgres, Auth, RLS)              |
| Charts        | Recharts 3                                  |
| Icons         | Lucide React                                |
| Toasts        | React Hot Toast                             |
| Utilities     | clsx (class merging)                        |
| Lint          | ESLint 10 + typescript-eslint               |
| Deploy target | Vercel (static SPA)                         |

---

## Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Type-check then build for production
npm run build

# Lint all TypeScript files
npm run lint

# Preview production build locally
npm run preview
```

---

## Environment Variables

Defined in `.env.local` (git-ignored). See `.env.example` for shape.

| Variable                  | Purpose                        |
| ------------------------- | ------------------------------ |
| `VITE_SUPABASE_URL`       | Supabase project URL           |
| `VITE_SUPABASE_ANON_KEY`  | Supabase anonymous/public key  |

Access in code via `import.meta.env.VITE_*`. Never expose service-role keys on the client.

---

## Architecture & Folder Structure

```
src/
├── components/
│   ├── auth/            # ProtectedRoute guard
│   ├── categories/      # CategoryForm, CategoryList
│   ├── dashboard/       # StatCard, RecentTransactions, MonthlyChart, CategoryChart
│   ├── transactions/    # TransactionForm, TransactionList, TransactionFilters
│   └── ui/              # Button, Input, Select, TextArea, Card, Modal, Badge, Spinner, EmptyState
├── context/             # AuthContext (AuthProvider component)
├── hooks/               # useAuth, useTransactions, useCategories, useProfile, useDashboard
├── layouts/             # AuthLayout, DashboardLayout
├── lib/                 # supabase.ts, queryClient.ts
├── pages/               # LoginPage, SignUpPage, ForgotPasswordPage, ResetPasswordPage,
│                        #   DashboardPage, TransactionsPage, CategoriesPage, ProfilePage
├── routes/              # Route definitions (index.tsx)
├── services/            # profiles.ts, categories.ts, transactions.ts (Supabase CRUD)
├── styles/              # index.css (Tailwind v4 + theme)
├── types/               # TypeScript interfaces and types
└── utils/               # cn.ts, formatCurrency.ts, formatDate.ts, constants.ts
```

### Key conventions

- **One component per file.** File name matches the default export.
- **Path alias:** Use `@/` to import from `src/`. Example: `import Button from '@/components/ui/Button'`.
- **Function declarations** for all components: `export default function Foo()`.
- **TanStack Query** for all server state (fetch, cache, mutations).
- **React Hook Form + Zod** for all form validation.
- **Services return `{ data, error }`** tuples — never throw.

---

## Coding Standards

### TypeScript

- Strict mode (`strict: true`, `noUncheckedIndexedAccess: true`).
- Prefer `interface` for object shapes, `type` for unions/intersections.
- Export types with `export type` (verbatimModuleSyntax is on).
- No `any`. Use `unknown` + narrowing when needed.
- Use Zod schemas for runtime validation, derive TS types with `z.infer<>`.

### React Components

- **Function declarations**, not arrow functions.
- Props interface directly above the component.
- Keep components small (<150 lines). Extract logic into hooks.
- Use `clsx()` / `cn()` for conditional Tailwind classes.
- Use Lucide icons: `import { Icon } from 'lucide-react'`.
- Always provide accessible labels and keyboard handlers.

### Styling (Tailwind CSS v4)

- CSS-first config in `src/styles/index.css` with `@theme`.
- Utility classes directly in JSX. No inline `style={}`.
- Mobile-first responsive (`sm:`, `md:`, `lg:`).

### Data Fetching (TanStack Query)

- Custom hooks in `src/hooks/` wrap `useQuery` / `useMutation`.
- Query keys include user ID and relevant filter params.
- Mutations invalidate related queries on success.
- Toast notifications on mutation success/error.

### Forms (React Hook Form + Zod)

- Zod schema defined in the form component file.
- `zodResolver` passed to `useForm`.
- Form data types derived from `z.infer<>`.
- Error messages shown via `errors.field?.message`.

### Supabase Services (`src/services/`)

- One file per table: `transactions.ts`, `categories.ts`, `profiles.ts`.
- Functions return `{ data, error }` tuples.
- RLS enforced server-side. Client uses anon key.

---

## Error Handling

- **Services:** return `{ data, error }` — never throw.
- **Hooks:** TanStack Query surfaces errors; mutations show toast.
- **Forms:** inline error messages from Zod validation.
- **UI:** loading/error/empty states for all async operations.

---

## Database Schema

Three tables — all with RLS enabled:

| Table          | Key Columns                                           |
| -------------- | ----------------------------------------------------- |
| `profiles`     | `id` (= auth.uid), `email`, `full_name`, `currency`  |
| `categories`   | `id`, `user_id`, `name`, `type`, `color`, `icon`      |
| `transactions` | `id`, `user_id`, `category_id`, `type`, `amount`, `description`, `notes`, `date` |

- `type` is either `'income'` or `'expense'` for both categories and transactions.
- `amount` is `DECIMAL(12,2)`, must be > 0.
- Default categories seeded on signup (8 expense + 4 income).
- Full DDL: `supabase/migrations/001_initial_schema.sql`.

---

## Deployment (Vercel)

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **SPA fallback:** configured in `vercel.json`
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel env vars.

---

## Workflow for Every Task

1. **Read** the relevant code first.
2. **Reuse** existing hooks, services, utils, and UI components.
3. **Plan** before changing code.
4. **Implement** minimal, well-structured changes.
5. **Update** tests and docs when behavior changes.
6. **Summarize** what changed and why.
