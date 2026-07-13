# ExpenseTracker

A modern personal finance app for tracking income and expenses, managing categories, and visualizing spending with interactive charts and deep analytics.

## Tech Stack

- **Frontend:** React 19 · TypeScript · Vite 8 · Tailwind CSS v4
- **Data:** TanStack Query 5 · React Hook Form 7 · Zod 4
- **Routing:** React Router 7
- **Backend:** Supabase (Postgres + Auth + RLS + Google OAuth)
- **Charts:** Recharts 3
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Testing:** Vitest · React Testing Library
- **Deploy:** Vercel (static SPA)

## Features

- 🔐 Authentication (email/password + Google OAuth)
- 📊 Dashboard with gradient stat cards, charts, and recent activity
- 📈 Full Analytics module (20+ charts, heatmap, insights, reports)
- 💰 Transaction management with search, filters, date range, and sorting
- 🏷️ Category management with color/icon customization
- 🌙 Dark mode with comprehensive CSS coverage
- 👤 Profile settings with currency preference (default: INR)
- 📱 Fully responsive (320px–1440px, mobile-first)
- ♿ WCAG AA accessible (ARIA, keyboard nav, skip link, focus management)
- ✨ Smooth Framer Motion animations (page transitions, modals, stagger)
- 💀 Skeleton loading states for every component
- 📭 Contextual empty states with guidance and CTAs
- 📤 CSV export for analytics data
- 🎨 Complete design system with tokens and reusable components

## Getting Started

### Prerequisites

- Node.js 22.x
- npm or yarn
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

### 4. Configure Google OAuth (Optional)

1. Enable Google provider in Supabase Dashboard → Authentication → Providers
2. Add your Google OAuth Client ID and Secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
3. Add redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`

### 5. Start Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start Vite dev server (port 5173)    |
| `npm run build`      | Type-check + production build        |
| `npm run lint`       | Lint TypeScript files with ESLint    |
| `npm run test`       | Run all tests                        |
| `npm run test:watch` | Run tests in watch mode              |
| `npm run test:coverage` | Run tests with coverage report    |
| `npm run preview`    | Serve production build locally       |

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set environment variables:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
4. Deploy — uses `yarn install --no-lockfile` and `yarn run build`

The `vercel.json` handles SPA routing, `public/_headers` handles caching.

## Project Structure

```
src/
├── components/
│   ├── analytics/       # 20+ chart & analysis components
│   ├── auth/            # ProtectedRoute, GoogleSignInButton
│   ├── categories/      # CategoryForm, CategoryList
│   ├── dashboard/       # StatCard, Charts, RecentTransactions
│   ├── transactions/    # TransactionForm, List, Filters
│   └── ui/              # Button, Input, Modal, Card, Skeleton, Avatar,
│                        #   FormAlert, Divider, SectionHeader, StatusDot, etc.
├── context/             # AuthContext, ThemeContext
├── engines/             # analytics.ts (pure computation functions)
├── hooks/               # useAuth, useTransactions, useCategories,
│                        #   useDashboard, useProfile, useAnalytics, useCurrency
├── layouts/             # AuthLayout, DashboardLayout
├── lib/                 # supabase.ts, queryClient.ts, queryKeys.ts
├── pages/               # Dashboard, Transactions, Categories, Profile,
│                        #   Analytics, Auth pages
├── routes/              # Route definitions
├── services/            # Supabase CRUD (profiles, categories, transactions)
├── styles/              # Tailwind CSS + dark mode + design system tokens
├── test/                # Test setup, utilities, factories, mocks
├── types/               # TypeScript interfaces (app + analytics)
└── utils/               # cn, formatCurrency, formatDate, constants, animations
tests/                   # 54 test files, 321 tests
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

## Testing

- **Framework:** Vitest 4 + React Testing Library + jsdom
- **Tests:** 321 passing across 54 test files
- **Coverage:** Services 100%, Utils 100%, Hooks 85%+, UI 90%+

```bash
npm run test            # Run once
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

## License

Private
