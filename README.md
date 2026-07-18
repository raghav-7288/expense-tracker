# ExpenseTracker

> A modern, full-featured personal finance tracker built with React 19 and Supabase.

🌐 **Live Demo:** [expense-tracker-rg.vercel.app](https://expense-tracker-rg.vercel.app)

---

## Features

### 🔐 Authentication
- Email/password sign up and sign in
- Google OAuth integration
- Forgot password / reset password flow
- Protected routes with auth guards

### 📊 Dashboard
- Total balance, income, and expense stats
- Monthly income vs. expenses chart
- Category breakdown pie chart
- Recent transactions feed

### 📈 Analytics (20+ charts & insights)
- Income vs. Expense trends
- Cash flow analysis
- Savings trend tracking
- Daily, weekly, and monthly spending charts
- Expense heatmap
- Category pie charts & comparison
- Financial health score
- AI-powered smart insights
- Spending pattern analysis
- Largest/smallest transaction rankings
- Top categories breakdown table
- Monthly & yearly reports
- Investment tracker

### 💳 Transactions
- Full CRUD — create, edit, delete
- Filter by type, category, date range, and search
- Sort: newest/oldest, highest/lowest amount, A–Z / Z–A
- CSV import and export
- Optimistic delete with rollback

### 🏷️ Categories
- System categories (global defaults, read-only)
- Custom user categories (create, edit, delete)
- Hide/restore system categories
- Copy system category to make it editable
- Filter by type, custom, or default
- Color picker and icon selector

### 👤 Profile
- Update name and currency
- Change password
- Dark mode toggle
- 15+ supported currencies

### 🎨 Design
- Fully responsive (mobile, tablet, desktop)
- Dark mode with system preference detection
- Smooth page transitions (Framer Motion)
- Accessible — ARIA labels, keyboard navigation, skip links
- Skeleton loaders, empty states, and error states

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 |
| **Language** | TypeScript 6 (strict mode) |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS v4 |
| **Backend** | Supabase (Postgres + Auth + RLS) |
| **State** | TanStack React Query 5, Zustand |
| **Forms** | React Hook Form 7 + Zod 4 |
| **Charts** | Recharts 3 |
| **Routing** | React Router 7 |
| **Animations** | Framer Motion 12 |
| **Icons** | Lucide React |
| **Notifications** | react-hot-toast |
| **Testing** | Vitest 4 + React Testing Library |

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

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_category_system.sql`
3. `supabase/migrations/003_audit_fixes.sql`
4. `supabase/migrations/004_fix_transaction_category_fk.sql`
5. `supabase/migrations/005_add_investment_expense_category.sql`

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed instructions.

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

**Current status:** 65 test files · 533 passing tests · 81% statement coverage

---

## Deployment

### Vercel (Recommended)

1. Push your repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects the config from `vercel.json`

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## Project Structure

```
expense-tracker/
├── public/                  # Static assets, security headers
├── src/
│   ├── components/
│   │   ├── analytics/       # 20 chart & insight components
│   │   ├── auth/            # Auth forms, Google sign-in, protected route
│   │   ├── categories/      # Category list, form, management
│   │   ├── dashboard/       # Stat cards, charts, recent transactions
│   │   ├── layout/          # Layout primitives
│   │   ├── transactions/    # Transaction list, form, filters, CSV
│   │   └── ui/              # Reusable UI primitives (Button, Modal, Input, etc.)
│   ├── context/             # AuthContext, ThemeContext
│   ├── engines/             # Analytics computation engine
│   ├── hooks/               # Custom React hooks
│   ├── layouts/             # AuthLayout, DashboardLayout
│   ├── lib/                 # Supabase client, React Query config
│   ├── pages/               # Page components (lazy-loaded)
│   ├── routes/              # React Router configuration
│   ├── services/            # Supabase data access layer
│   ├── stores/              # Zustand stores
│   ├── styles/              # Global CSS, design system tokens
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Pure utility functions
├── supabase/
│   └── migrations/          # SQL migration files (001–005)
├── tests/                   # Test files (mirrors src/ structure)
└── docs/                    # Architecture docs, AI context
```

---

## Database Schema

### Tables

| Table | Purpose |
|---|---|
| `profiles` | User profile (name, currency, avatar) |
| `system_categories` | Global default categories (read-only) |
| `user_categories` | Per-user custom categories (soft-delete) |
| `user_hidden_categories` | Hidden system category preferences |
| `transactions` | Income/expense records |

All tables have **Row Level Security (RLS)** enabled — users can only access their own data.

---

## Roadmap

- [ ] Budget goals and spending limits
- [ ] Recurring transactions
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
