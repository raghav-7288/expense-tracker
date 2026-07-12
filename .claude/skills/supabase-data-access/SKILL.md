# Skill: Supabase Data Access

> How to write Supabase queries, manage schema changes, and follow RLS conventions in this project.

## Supabase Client

The singleton client lives at `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

Import it in service files: `import { supabase } from '@/lib/supabase'`.

## Service File Pattern

Each table gets a service file in `src/services/`. Example for expenses:

```ts
// src/services/expenses.ts
import { supabase } from '@/lib/supabase';
import type { Expense, CreateExpenseInput } from '@/data/expense.types';

export async function getExpenses(userId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, categories(name, color, icon)')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  return { data: data as Expense[] | null, error };
}

export async function createExpense(input: CreateExpenseInput) {
  const { data, error } = await supabase
    .from('expenses')
    .insert(input)
    .select()
    .single();

  return { data: data as Expense | null, error };
}

export async function updateExpense(id: string, updates: Partial<CreateExpenseInput>) {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data: data as Expense | null, error };
}

export async function deleteExpense(id: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  return { error };
}
```

### Rules

1. **Always return `{ data, error }`** — never throw from service functions.
2. **Use `.select()` after insert/update** to get the row back.
3. **Use `.single()` when expecting one row** (insert, update by id, get by id).
4. **Type the return** with `as Type | null` until generated Supabase types are added.
5. **Never pass `user_id` from the client for auth checks** — RLS handles authorization. But you still need `user_id` for insert since the column is `NOT NULL`.

## Schema Reference

### profiles

| Column       | Type         | Notes                            |
| ------------ | ------------ | -------------------------------- |
| `id`         | UUID (PK)    | = `auth.users.id`               |
| `email`      | TEXT         | NOT NULL                         |
| `full_name`  | TEXT         | nullable                         |
| `avatar_url` | TEXT         | nullable                         |
| `created_at` | TIMESTAMPTZ  | auto                             |
| `updated_at` | TIMESTAMPTZ  | auto via trigger                 |

### categories

| Column       | Type         | Notes                            |
| ------------ | ------------ | -------------------------------- |
| `id`         | UUID (PK)    | auto-generated                   |
| `user_id`    | UUID (FK)    | → auth.users, CASCADE delete     |
| `name`       | TEXT         | NOT NULL, UNIQUE per user        |
| `color`      | TEXT         | hex color, default `#3b82f6`     |
| `icon`       | TEXT         | Lucide icon name, default `tag`  |
| `created_at` | TIMESTAMPTZ  | auto                             |
| `updated_at` | TIMESTAMPTZ  | auto via trigger                 |

### expenses

| Column        | Type           | Notes                          |
| ------------- | -------------- | ------------------------------ |
| `id`          | UUID (PK)      | auto-generated                 |
| `user_id`     | UUID (FK)      | → auth.users, CASCADE delete   |
| `category_id` | UUID (FK)      | → categories, SET NULL on del  |
| `amount`      | DECIMAL(12,2)  | must be > 0                    |
| `description` | TEXT           | NOT NULL                       |
| `notes`       | TEXT           | nullable                       |
| `date`        | DATE           | default CURRENT_DATE           |
| `created_at`  | TIMESTAMPTZ    | auto                           |
| `updated_at`  | TIMESTAMPTZ    | auto via trigger               |

## RLS Policies

All tables have RLS enabled. Policies follow the pattern:

- **SELECT:** `auth.uid() = user_id` (or `= id` for profiles)
- **INSERT:** `WITH CHECK (auth.uid() = user_id)`
- **UPDATE:** `USING` + `WITH CHECK` both require `auth.uid() = user_id`
- **DELETE:** `USING (auth.uid() = user_id)`

The anon key + RLS means the client can only access rows belonging to the authenticated user. No additional authorization checks are needed in application code.

## Auth Patterns

```ts
// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Sign up
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { full_name: name } },
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// Sign out
await supabase.auth.signOut();

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => { /* ... */ });
```

## Adding a New Table

1. Create a new migration file: `supabase/migrations/002_<name>.sql`.
2. Define the table with `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`.
3. Enable RLS: `ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY`.
4. Add SELECT/INSERT/UPDATE/DELETE policies using `auth.uid() = user_id`.
5. Add the `update_updated_at` trigger.
6. Create a matching service file in `src/services/`.
7. Define TypeScript types and Zod schemas.

## Querying Patterns

```ts
// Filter by date range
.gte('date', startDate)
.lte('date', endDate)

// Join related data
.select('*, categories(name, color, icon)')

// Pagination
.range(offset, offset + limit - 1)

// Aggregate on client (Supabase doesn't support SQL aggregates via API)
// Use engines/ for calculations after fetching data

// Count
const { count } = await supabase
  .from('expenses')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId);
```

