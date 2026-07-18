# Changelog

All notable changes to ExpenseTracker are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-07-18

### Added

#### Core Features
- Email/password authentication with sign up, sign in, and password reset
- Google OAuth integration
- Protected route system with auth guards
- Dashboard with balance stats, monthly chart, category breakdown, and recent transactions
- Full transaction management — create, edit, delete with form validation
- Transaction filtering by type, category, date range, and search
- Transaction sorting — newest/oldest, highest/lowest amount, A–Z / Z–A
- CSV import and export for transactions
- Optimistic UI updates on transaction delete with rollback

#### Categories
- Dual-category system — global system categories + user custom categories
- Create, edit, and delete custom categories
- Hide and restore system categories
- Copy system category to create an editable version
- Category filtering by type (expense/income/custom/default)
- Color picker and icon selector for categories

#### Analytics (20+ visualizations)
- Summary cards with period-over-period comparison
- Income vs. Expense bar chart
- Cash flow analysis chart
- Savings trend tracking
- Daily, weekly, and monthly spending charts
- Expense heatmap
- Category pie charts (expense and income)
- Category comparison bar chart
- Financial health score card
- Smart insights engine
- Spending pattern analysis
- Transaction rankings (largest/smallest)
- Top categories breakdown table
- Monthly and yearly reports
- Investment tracker

#### Profile & Settings
- Update name and currency preference
- Change password
- Dark mode toggle with system preference detection
- 15+ supported currencies

#### Design & UX
- Fully responsive layout (mobile, tablet, desktop)
- Dark mode with FOUC prevention
- Smooth page transitions with Framer Motion
- Skeleton loaders for all loading states
- Empty states with contextual messaging
- Error states with retry actions
- Accessible — ARIA labels, keyboard navigation, skip-to-content link

### Technical

#### Architecture
- React 19 with TypeScript 6 (strict mode)
- Vite 8 build tool with code splitting (lazy-loaded routes)
- Tailwind CSS v4 for styling
- Supabase backend with PostgreSQL and Row Level Security
- TanStack React Query 5 for server state management
- React Hook Form 7 + Zod 4 for form validation
- Recharts 3 for data visualization
- React Router 7 for client-side routing

#### Security
- UUID validation on PostgREST filter inputs
- Search input sanitization (LIKE wildcard escaping)
- Security headers (HSTS, X-Frame-Options, CSP, XSS protection)
- localStorage access wrapped in try/catch
- No deprecated auth-bypass functions
- Environment variable validation at startup

#### Performance
- Route-level code splitting with React.lazy
- React Query caching with 5-min stale time and 15-min GC
- Optimistic updates for instant UI feedback
- Parallel data fetching with Promise.all
- Immutable asset caching (1-year max-age)

#### Testing
- 65 test files with 533 passing tests
- 81% statement coverage
- Vitest 4 + React Testing Library + jsdom
- Services, hooks, components, pages, and layouts tested

#### Database
- 5 migration files for incremental schema evolution
- Row Level Security on all tables
- Indexes on frequently queried columns
- Input length constraints and format validation
- Soft-delete for user categories
- Auto-generated timestamps and profiles

