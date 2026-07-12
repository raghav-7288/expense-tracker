# ExpenseTracker

A modern personal finance app for tracking income and expenses, managing categories, and visualizing spending with interactive charts.

## Tech Stack

- **Frontend:** React 19 · TypeScript · Vite 8 · Tailwind CSS v4
- **Data:** TanStack Query 5 · React Hook Form 7 · Zod 4
- **Routing:** React Router 7
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Charts:** Recharts 3
- **Icons:** Lucide React
- **Deploy:** Vercel (static SPA)

## Features

- 🔐 Authentication (sign up, sign in, password reset)
- 📊 Dashboard with balance, income/expense stats, and charts
- 💰 Transaction management with search, filters, and sorting
- 🏷️ Category management with color/icon customization
- 🌙 Dark mode with system persistence
- 👤 Profile settings with currency preference
- 📱 Fully responsive (mobile-first)
- ♿ Accessible (ARIA labels, keyboard navigation, focus management)

## Getting Started

### Prerequisites

- Node.js ≥ 20
- npm
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/raghav-7288/expense-tracker.git
cd expense-tracker
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
- Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project → Settings → API
- Copy the **Project URL** and **anon/public key**

### 3. Set Up Database

Open the Supabase SQL Editor and paste the contents of:
```
supabase/migrations/001_initial_schema.sql
```

Click **Run**. This creates all tables, RLS policies, triggers, and default categories.

### 4. Start Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start Vite dev server (port 5173)    |
| `npm run build`   | Type-check + production build        |
| `npm run lint`    | Lint TypeScript files with ESLint    |
| `npm run preview` | Serve production build locally       |

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set environment variables:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
4. Deploy — Vercel auto-detects Vite, builds with `npm run build`, serves from `dist/`

The `vercel.json` handles SPA client-side routing fallback.

## Project Structure

```
src/
├── components/
│   ├── auth/            # ProtectedRoute
│   ├── categories/      # CategoryForm, CategoryList
│   ├── dashboard/       # StatCard, Charts, RecentTransactions
│   ├── transactions/    # TransactionForm, List, Filters
│   └── ui/              # Button, Input, Modal, Card, Skeleton, etc.
├── context/             # AuthContext, ThemeContext
├── hooks/               # useAuth, useTransactions, useCategories, useDashboard, useProfile
├── layouts/             # AuthLayout, DashboardLayout
├── lib/                 # supabase.ts, queryClient.ts, queryKeys.ts
├── pages/               # Dashboard, Transactions, Categories, Profile, Auth pages
├── routes/              # Route definitions
├── services/            # Supabase CRUD (profiles, categories, transactions)
├── styles/              # Tailwind CSS + dark mode
├── types/               # TypeScript interfaces
└── utils/               # cn, formatCurrency, formatDate, constants
```

## Database Schema

Three tables with Row Level Security:

| Table          | Purpose                                    |
| -------------- | ------------------------------------------ |
| `profiles`     | User metadata (name, currency, avatar)     |
| `categories`   | Income/expense categories per user         |
| `transactions` | All financial transactions with date/notes |

- Auto-creates profile on signup (trigger)
- Seeds 12 default categories on signup (trigger)
- Auto-updates `updated_at` on every edit (trigger)

## Environment Variables

| Variable                 | Description              | Required |
| ------------------------ | ------------------------ | -------- |
| `VITE_SUPABASE_URL`      | Supabase project URL     | ✅       |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key | ✅       |

> ⚠️ Never use the `service_role` key in frontend code. The anon key + RLS is secure.

## License

Private
