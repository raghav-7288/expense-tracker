# Database Setup

This guide walks you through setting up the Supabase PostgreSQL database for ExpenseTracker.

## Prerequisites

- A [Supabase](https://supabase.com) account (free tier works)
- A Supabase project created

## Step 1: Open the SQL Editor

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar

## Step 2: Run Migrations in Order

Run each migration file **one at a time, in order**. Copy the contents of each file into the SQL Editor and click **Run**.

### Migration 1: Initial Schema

**File:** `supabase/migrations/001_initial_schema.sql`

Creates the core tables:

| Table | Description |
|---|---|
| `profiles` | User profiles with name, email, currency preference |
| `categories` | User-specific expense/income categories |
| `transactions` | Income and expense records |

Also sets up:
- Row Level Security (RLS) policies on all tables
- Indexes for performance
- Auto-create profile on user signup (trigger)
- Auto-update `updated_at` timestamps (trigger)
- Default categories on signup (12 categories: 8 expense + 4 income)

### Migration 2: Category System Refactor

**File:** `supabase/migrations/002_category_system.sql`

Introduces the dual-category architecture:

| Table | Description |
|---|---|
| `system_categories` | Global default categories (read-only, shared by all users) |
| `user_categories` | Per-user custom categories with soft-delete support |
| `user_hidden_categories` | Allows users to hide system categories they don't want |

Also:
- Adds `system_category_id` and `user_category_id` columns to `transactions`
- Migrates existing category data to the new structure
- Creates a `merged_categories` view

### Migration 3: Audit Fixes

**File:** `supabase/migrations/003_audit_fixes.sql`

Security and data integrity improvements:
- Text length constraints (name ≤ 100 chars, description ≤ 500, notes ≤ 2000)
- Color format validation (hex format `#RRGGBB`)
- Currency length constraint (≤ 5 chars)
- Additional indexes for query performance
- Profile DELETE policy
- RLS verification for all tables

### Migration 4: Transaction Category FK Fix

**File:** `supabase/migrations/004_fix_transaction_category_fk.sql`

- Drops legacy FK constraint from `transactions.category_id → categories`
- Backfills `system_category_id` and `user_category_id` from existing data
- Adds indexes on the new FK columns

### Migration 5: Investment Category

**File:** `supabase/migrations/005_add_investment_expense_category.sql`

- Adds "Investments" as a system expense category
- Idempotent — safe to run multiple times

## Step 3: Verify Setup

After running all migrations, verify the tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- `categories` (legacy, may be empty)
- `profiles`
- `system_categories`
- `transactions`
- `user_categories`
- `user_hidden_categories`

## Step 4: Verify RLS

Ensure Row Level Security is enabled on all tables:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.

## Schema Diagram

```
┌──────────────────┐     ┌───────────────────────┐
│     profiles     │     │  system_categories    │
├──────────────────┤     ├───────────────────────┤
│ id (PK, FK)      │     │ id (PK)               │
│ email            │     │ name                  │
│ full_name        │     │ type (income/expense)  │
│ currency         │     │ color                 │
│ created_at       │     │ icon                  │
│ updated_at       │     │ created_at            │
└──────────────────┘     └───────────────────────┘

┌──────────────────────┐     ┌──────────────────────────┐
│   user_categories    │     │  user_hidden_categories  │
├──────────────────────┤     ├──────────────────────────┤
│ id (PK)              │     │ user_id (FK)             │
│ user_id (FK)         │     │ category_id (FK)         │
│ name                 │     │ hidden_at                │
│ type                 │     └──────────────────────────┘
│ color                │
│ icon                 │
│ source_category_id   │
│ deleted_at           │
│ created_at           │
└──────────────────────┘

┌──────────────────────────┐
│      transactions        │
├──────────────────────────┤
│ id (PK)                  │
│ user_id (FK)             │
│ system_category_id (FK)  │
│ user_category_id (FK)    │
│ type (income/expense)    │
│ amount                   │
│ description              │
│ notes                    │
│ date                     │
│ created_at               │
│ updated_at               │
└──────────────────────────┘
```

## Resetting the Database

To start fresh, drop all tables and re-run migrations:

```sql
-- ⚠️ WARNING: This deletes ALL data
DROP TABLE IF EXISTS user_hidden_categories CASCADE;
DROP TABLE IF EXISTS user_categories CASCADE;
DROP TABLE IF EXISTS system_categories CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP VIEW IF EXISTS merged_categories CASCADE;

-- Then re-run all migration files in order
```

## Troubleshooting

### "relation already exists"

The migration has already been run. This is safe to ignore — most migrations use `IF NOT EXISTS`.

### "permission denied for table"

Ensure RLS policies are correctly applied. Re-run migration 001 and 002.

### "Could not find category"

Run migration 005 to ensure the Investments category exists in `system_categories`.

