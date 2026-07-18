# Copilot Instructions — Expense Tracker

## Quick Context

This is a React 19 + TypeScript + Vite 8 SPA backed by Supabase (Postgres + Auth).
See `CLAUDE.md` at the project root for full architecture details, coding standards, and conventions.

## Key Rules

- Use TypeScript strict mode. No `any`.
- Use `@/` path alias for imports from `src/`.
- Use function declarations for components, not arrow functions.
- Use Tailwind CSS v4 utility classes for styling, `clsx()` for conditionals.
- Use Zustand for global state (one store per domain in `src/stores/`).
- Use Zod for runtime validation. Derive TS types with `z.infer<>`.
- Services in `src/services/` return `{ data, error }` tuples — never throw.
- All Supabase tables have RLS. Always authenticate before querying.
- Use `react-hot-toast` for transient notifications.
- Use Lucide React for icons.
- Prefer reusing existing components/hooks/utils over creating new ones.

## Do Not Modify

- **`vercel.json`** — This file must never be changed. It must always remain exactly as-is with `yarn install --no-lockfile` and `yarn run build`. Do not replace with npm commands or alter any fields.

## File Locations

| What              | Where                          |
| ----------------- | ------------------------------ |
| UI components     | `src/components/ui/`           |
| Page components   | `src/components/pages/`        |
| Layout            | `src/components/layout/`       |
| Auth components   | `src/components/auth/`         |
| Custom hooks      | `src/hooks/`                   |
| Zustand stores    | `src/stores/`                  |
| Supabase services | `src/services/`                |
| Supabase client   | `src/lib/supabase.ts`          |
| Business logic    | `src/engines/`                 |
| Pure utilities    | `src/utils/`                   |
| DB schema         | `supabase/migrations/`         |
