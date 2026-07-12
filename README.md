# ExpenseTracker

Personal finance app for tracking expenses, managing categories, and visualizing spending.

## Tech Stack

- **Frontend:** React 19 · TypeScript · Vite 8 · Tailwind CSS v4
- **State:** Zustand · React Router 7
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Charts:** Recharts · **Icons:** Lucide React · **Validation:** Zod
- **Deploy:** Vercel (static SPA)

## Getting Started

### Prerequisites

- Node.js ≥ 20
- npm
- A [Supabase](https://supabase.com) project

### Setup

```bash
# Clone and install
git clone <repo-url> && cd expense-tracker
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key

# Run the database migration
# Paste supabase/migrations/001_initial_schema.sql into the Supabase SQL Editor

# Start development
npm run dev
```

### Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start Vite dev server (port 5173)    |
| `npm run build`   | Type-check + production build        |
| `npm run lint`    | Lint TypeScript files with ESLint    |
| `npm run preview` | Serve production build locally       |

## Project Structure

```
src/
├── assets/          # Static files bundled by Vite
├── components/
│   ├── auth/        # Authentication forms
│   ├── layout/      # App shell, nav, sidebar
│   ├── pages/       # Route-level page components
│   └── ui/          # Reusable UI primitives
├── context/         # React context providers
├── data/            # Constants, enums, seed data
├── engines/         # Business logic (calculations, aggregations)
├── hooks/           # Custom React hooks
├── lib/             # Third-party client init (Supabase, etc.)
├── services/        # Data-access layer (Supabase CRUD)
├── stores/          # Zustand state stores
└── utils/           # Pure utility functions
```

## Database

Three core tables with row-level security:

- **profiles** — user metadata (auto-created on signup)
- **categories** — user expense categories (8 defaults seeded)
- **expenses** — individual expense records

Schema: [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)

## Environment Variables

| Variable                 | Description              |
| ------------------------ | ------------------------ |
| `VITE_SUPABASE_URL`      | Supabase project URL     |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key |

## AI-Assisted Development

See [`CLAUDE.md`](CLAUDE.md) for detailed instructions optimized for Claude, Copilot, and other AI assistants.

## License

Private
