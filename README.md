# ExpenseTracker

> A modern, full-featured personal finance tracker built with React 19 and Supabase.

 **Live Demo:** [expense-tracker-rg.vercel.app](https://expense-tracker-rg.vercel.app)

---

## Features

### Authentication
- Email/password sign up and sign in
- Google OAuth integration
- Forgot password / reset password flow
- Protected routes with auth guards

### Dashboard
- Total balance, income, and expense stats
- Monthly income vs. expenses chart
- Category breakdown pie chart
- Recent transactions feed

### Transactions Hub
- A single hub at `/transactions` with three sub-tabs — **All · Recurring · Loans**
- Legacy `/recurring` and `/loans` URLs redirect into the hub (bookmarks stay valid)
- Deep-linkable tabs with browser back/forward and refresh support

### Transactions
- Full CRUD — create, edit, delete
- Filter by type, category, account, date range, and search (debounced)
- Sort: newest/oldest, highest/lowest amount, A–Z / Z–A
- CSV import and export
- Optimistic delete with rollback
- 🔁 badge marks transactions generated from a recurring schedule

### Recurring Transactions
- Schedule any income/expense to repeat **weekly, monthly, or yearly**
- Enable directly from the Add Transaction form, or manage from the Recurring tab
- Optional end date, or repeat indefinitely
- Pause / resume, edit, and delete rules
- Client-side generator materializes due (and missed) transactions on app load
- Date math anchored on the start date — no month-end or leap-day drift

### Loans (Borrow & Lend)
- Track money **lent** and **borrowed** with a counterparty name
- Record repayments; outstanding balance and status update automatically
- Status lifecycle: `active` → `partially_paid` → `settled`
- Loan events are backed by real transactions (disbursement + repayments)
- Loan summary card on the Dashboard

### Multi-Account Management
- Optional accounts (checking, savings, credit card, cash, investment, other)
- Per-account computed balances (initial balance + income − expenses)
- Assign transactions to an account; fully opt-in (account is nullable)
- Activate/deactivate and reorder accounts

### Analytics (20+ charts & insights)
- Income vs. Expense trends
- Cash flow analysis
- Savings trend tracking
- Daily, weekly, and monthly spending charts
- Expense heatmap
- Category pie charts & comparison
- Financial health score
- Smart insights engine
- Spending pattern analysis
- Largest/smallest transaction rankings
- Top categories breakdown table
- Monthly & yearly reports
- Investment tracker

### Categories
- System categories (global defaults, read-only)
- Custom user categories (create, edit, delete)
- **Inline category creation** — add a category directly from the Add Transaction
  and Recurring forms without leaving the page
- Hide/restore system categories
- Copy system category to make it editable
- Filter by type, custom, or default
- Color picker and icon selector
- Soft delete — deleted names can be reused; historical transactions keep their label

### Profile
- Update name and currency
- Change password
- Dark mode toggle
- 15+ supported currencies

### Design
- Fully responsive (mobile, tablet, desktop)
- Dark mode with system preference detection
- Smooth page transitions (Framer Motion)
- Accessible — ARIA labels, keyboard navigation, skip links
- Skeleton loaders, empty states, and error states
- Toast notifications (theme-aware) via react-hot-toast

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 |
| **Language** | TypeScript 6 (strict mode) |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS v4 |
| **Backend** | Supabase (Postgres + Auth + RLS) |
| **Server State** | TanStack React Query 5 |
| **Client State** | React Context (auth, theme) |
| **Forms** | React Hook Form 7 + Zod 4 |
| **Charts** | Recharts 3 |
| **Routing** | React Router 7 |
| **Animations** | Framer Motion 12 |
| **Icons** | Lucide React |
| **Notifications** | react-hot-toast |
| **Testing** | Vitest 4 + React Testing Library |

---

## Screenshots

> _Screenshots coming soon._ Drop images into `docs/screenshots/` and reference them here.

| Dashboard | Transactions Hub | Analytics |
|---|---|---|
| _(placeholder)_ | _(placeholder)_ | _(placeholder)_ |

| Recurring | Loans | Accounts |
|---|---|---|
| _(placeholder)_ | _(placeholder)_ | _(placeholder)_ |

---

## Quick Start

### Prerequisites

- **Node.js 22.x** — [Download](https://nodejs.org/)
- **Supabase project** — [Create one free](https://supabase.com/dashboard)

### 1. Clone and install

```bash
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> Get these from [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/_/settings/api).

### 3. Set up the database

Run the migration files **in order** in your Supabase SQL Editor:

| # | File | Adds |
|---|---|---|
| 001 | `001_initial_schema.sql` | Profiles, transactions, base schema, RLS |
| 002 | `002_category_system.sql` | System + user categories, hidden categories |
| 003 | `003_audit_fixes.sql` | Index & constraint hardening |
| 004 | `004_fix_transaction_category_fk.sql` | Split category foreign keys |
| 005 | `005_add_investment_expense_category.sql` | Seed investment category |
| 006 | `006_merge_description_into_notes.sql` | Consolidate description → notes |
| 007 | `007_accounts.sql` | Multi-account support |
| 008 | `008_performance_functions.sql` | Balance/search RPCs + trigram index |
| 009 | `009_loans_schema.sql` | Loans + loan_transactions |
| 010 | `010_audit_followups.sql` | Audit follow-up fixes |
| 011 | `011_recurring_transactions.sql` | Recurring rules + `recurring_id` link |
| 012 | `012_fix_user_category_unique.sql` | Partial unique index for soft delete |

See [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) for detailed instructions.

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public API key | ✅ |

> ⚠️ **Never** use the `service_role` key in frontend code — it bypasses Row Level Security.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run verify-supabase` | Verify Supabase connection |
| `npm run context` | Regenerate `docs/CONTEXT.md` project snapshot |

---

## Testing

The project uses **Vitest 4** with **React Testing Library** and **jsdom**.

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Current status:** 101 test files · 1,272 passing tests · ~82% statement coverage

---

## Deployment

### Vercel (Recommended)

1. Push your repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects the config from `vercel.json`

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

---

## Project Structure

```
expense-tracker/
├── public/                  # Static assets, security headers, SPA redirects
├── src/
│   ├── components/
│   │   ├── accounts/        # Account list, form, cards
│   │   ├── analytics/       # Chart & insight components
│   │   ├── auth/            # Auth forms, Google sign-in, protected route
│   │   ├── categories/      # Category list, form, management
│   │   ├── dashboard/       # Stat cards, charts, recent transactions
│   │   ├── loans/           # Loan list, form, repayment, summary
│   │   ├── recurring/       # Recurring list & form
│   │   ├── transactions/    # Transaction list, form, filters, CSV import/export
│   │   └── ui/              # Reusable UI primitives (Button, Modal, Input, etc.)
│   ├── context/             # AuthContext, ThemeContext
│   ├── engines/             # Analytics computation engine (pure)
│   ├── hooks/               # Custom React hooks (React Query wrappers)
│   ├── layouts/             # AuthLayout, DashboardLayout, TransactionsLayout
│   ├── lib/                 # Supabase client, React Query config, query keys
│   ├── pages/               # Page components (lazy-loaded)
│   ├── routes/              # React Router configuration
│   ├── services/            # Supabase data-access layer ({ data, error })
│   ├── styles/              # Global CSS, design system tokens, dark mode
│   ├── test/                # Test setup & shared render utilities
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Pure utilities (cn, formatCurrency, formatDate, …)
├── supabase/
│   └── migrations/          # SQL migration files (001–012)
├── tests/                   # Test files (mirrors src/ structure)
└── docs/                    # Architecture docs, AI context, reports/
```

---

## Database Overview

### Tables

| Table | Purpose |
|---|---|
| `profiles` | User profile (name, currency, avatar) |
| `system_categories` | Global default categories (read-only) |
| `user_categories` | Per-user custom categories (soft-delete via `deleted_at`) |
| `user_hidden_categories` | Hidden system-category preferences |
| `transactions` | Income / expense / lent / borrowed records |
| `accounts` | Optional multi-account balances |
| `loans` | Lending / borrowing records with outstanding + status |
| `loan_transactions` | Junction linking loans to their disbursement/repayment transactions |
| `recurring_transactions` | Recurring rules that materialize transactions |

> A legacy `categories` table remains from `001` for backward compatibility; the app
> reads from `system_categories` / `user_categories`.

### Key relationships

- `transactions.account_id` → `accounts.id` (`ON DELETE SET NULL`) — accounts are opt-in
- `transactions.recurring_id` → `recurring_transactions.id` (`ON DELETE SET NULL`) — generated rows survive rule deletion
- `transactions` reference categories via `system_category_id` / `user_category_id`, merged into one `categories` object by the service layer
- `loan_transactions` links `loans` ↔ `transactions` (each loan event is a real transaction)

### Server-side functions (RPCs)

- `get_balance_summary(uid)` — dashboard totals (income, expenses, monthly) in one query
- `get_account_balances(uid)` — per-account computed balances without N+1 fetches

All tables have **Row Level Security (RLS)** enabled — users can only access their own data.

---

## Future Improvements

- [ ] Server-side recurring generation (Edge Function + `pg_cron`) so transactions
      appear without the user opening the app
- [ ] `UNIQUE(recurring_id, date)` guard + `upsert` for defense-in-depth idempotency
- [ ] Budget goals and spending limits
- [ ] Multi-currency support with live exchange rates
- [ ] Receipt photo upload (Supabase Storage)
- [ ] Push notifications for budget alerts
- [ ] Export to PDF reports
- [ ] Shared household accounts
- [ ] Mobile app (React Native)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
