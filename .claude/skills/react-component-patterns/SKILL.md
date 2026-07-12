# Skill: React Component Patterns

> How to create, structure, and style React components in this project.

## Component Template

```tsx
// src/components/ui/Button.tsx
import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
          'bg-transparent text-gray-700 hover:bg-gray-100': variant === 'ghost',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
```

## Rules

### Structure

- **One component per file.** File name = component name in PascalCase.
- **Function declarations**, not arrow functions: `function Foo()` not `const Foo = () =>`.
- **Props interface** directly above the component, named `<Component>Props`.
- **Default export** for the component. Named exports for related types/hooks if needed.
- **Keep components under 150 lines.** Extract logic into custom hooks in `src/hooks/`.

### Imports

Use the `@/` path alias for all internal imports:

```ts
import { Button } from '@/components/ui/Button';
import { useExpenseStore } from '@/stores/useExpenseStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { getExpenses } from '@/services/expenses';
```

### Styling

- Use **Tailwind utility classes** directly in JSX.
- Use `clsx()` for conditional classes — it's already installed.
- **No inline `style={}`** unless a value is truly dynamic (e.g., chart colors from DB).
- Mobile-first responsive: `sm:`, `md:`, `lg:` prefixes.
- Use consistent spacing scale: `p-4`, `gap-4`, `space-y-4`.

### State

- **Local state:** `useState` for UI-only state (modals, form inputs).
- **Global state:** Zustand stores for shared domain data.
- **Server state:** Fetch in hooks or effects, store in Zustand after fetch.

### Forms

```tsx
import { z } from 'zod';
import { useState } from 'react';
import toast from 'react-hot-toast';

const expenseSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(200),
  category_id: z.string().uuid().optional(),
  date: z.string().date(),
  notes: z.string().max(500).optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function ExpenseForm({ onSubmit }: { onSubmit: (data: ExpenseFormData) => Promise<void> }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw = Object.fromEntries(formData);

    const result = expenseSchema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (key) fieldErrors[String(key)] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await onSubmit(result.data);
      toast.success('Expense saved');
    } catch {
      toast.error('Failed to save expense');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* form fields with error display */}
    </form>
  );
}
```

### Icons

Use Lucide React icons. Import individually:

```tsx
import { Plus, Trash2, Edit, X } from 'lucide-react';

<button aria-label="Delete expense">
  <Trash2 size={16} className="text-red-500" />
</button>
```

### Toasts

Use `react-hot-toast` for transient notifications:

```tsx
import toast from 'react-hot-toast';

toast.success('Expense created');
toast.error('Failed to delete');
toast.loading('Saving...');
```

Add `<Toaster />` once in the app root.

### Accessibility Checklist

- [ ] `<button>` for clickable elements (never `<div onClick>`).
- [ ] `aria-label` on icon-only buttons.
- [ ] `<label htmlFor>` on every form input.
- [ ] Focus ring visible (`focus-visible:outline-*`).
- [ ] Modals trap focus and close on Escape.
- [ ] Loading states announced via `aria-busy` or live regions.

### Page Component Pattern

```tsx
// src/components/pages/DashboardPage.tsx
import { Suspense, lazy } from 'react';

const ExpenseChart = lazy(() => import('@/components/ui/ExpenseChart'));

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-gray-100" />}>
        <ExpenseChart />
      </Suspense>
    </main>
  );
}
```

### Zustand Store Pattern

```ts
// src/stores/useExpenseStore.ts
import { create } from 'zustand';
import type { Expense } from '@/data/expense.types';

interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  loading: false,
  error: null,
  setExpenses: (expenses) => set({ expenses }),
  addExpense: (expense) => set((s) => ({ expenses: [expense, ...s.expenses] })),
  removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
```

### Custom Hook Pattern

```ts
// src/hooks/useExpenses.ts
import { useEffect } from 'react';
import { useExpenseStore } from '@/stores/useExpenseStore';
import { getExpenses } from '@/services/expenses';
import { supabase } from '@/lib/supabase';

export function useExpenses() {
  const { expenses, loading, error, setExpenses, setLoading, setError } = useExpenseStore();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data, error } = await getExpenses(user.id);
      if (cancelled) return;

      if (error) {
        setError(error.message);
      } else {
        setExpenses(data ?? []);
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [setExpenses, setLoading, setError]);

  return { expenses, loading, error };
}
```

