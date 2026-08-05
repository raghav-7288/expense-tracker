import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import type {
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetProgress,
  BudgetStatus,
  MergedCategory,
} from '@/types';
import { getMergedCategories } from '@/services/categories';
import { getTransactions } from '@/services/transactions';
import { getMonthStart, getMonthEnd, getWeekStart, getWeekEnd } from '@/utils/formatDate';

// ─── Validation ───────────────────────────────────────────────────

const createBudgetSchema = z.object({
  user_id: z.string().uuid(),
  category_id: z.string().uuid(),
  category_source: z.enum(['system', 'user']),
  amount: z.number().positive('Amount must be positive'),
  period: z.enum(['weekly', 'monthly']),
  alert_threshold: z.number().min(0.01).max(1).default(0.80),
});

// ─── CRUD ─────────────────────────────────────────────────────────

export async function getBudgets(userId: string) {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return { data: data as Budget[] | null, error };
}

export async function createBudget(input: CreateBudgetInput) {
  const parsed = createBudgetSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Validation failed' } };
  }

  const { data, error } = await supabase
    .from('budgets')
    .insert({
      user_id: parsed.data.user_id,
      category_id: parsed.data.category_id,
      category_source: parsed.data.category_source,
      amount: parsed.data.amount,
      period: parsed.data.period,
      alert_threshold: parsed.data.alert_threshold,
    })
    .select()
    .single();

  return { data: data as Budget | null, error };
}

export async function updateBudget(id: string, input: UpdateBudgetInput) {
  const { data, error } = await supabase
    .from('budgets')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  return { data: data as Budget | null, error };
}

export async function deleteBudget(id: string) {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);

  return { error };
}

// ─── Budget Progress Calculation ──────────────────────────────────

export async function getBudgetProgress(userId: string): Promise<{ data: BudgetProgress[] | null; error: unknown }> {
  // 1. Fetch active budgets
  const { data: budgets, error: budgetsError } = await getBudgets(userId);
  if (budgetsError) return { data: null, error: budgetsError };
  if (!budgets || budgets.length === 0) return { data: [], error: null };

  // 2. Fetch categories to resolve names/colors/icons
  const { data: categories } = await getMergedCategories(userId);
  const categoryMap = new Map<string, MergedCategory>();
  for (const cat of categories ?? []) {
    categoryMap.set(cat.id, cat);
  }

  // 3. Determine date ranges needed (monthly and weekly)
  const monthStart = getMonthStart();
  const monthEnd = getMonthEnd();
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();

  // 4. Fetch expense transactions for the broader range (month covers week)
  const { data: transactions, error: txError } = await getTransactions(userId, {
    type: 'expense',
    date_from: weekStart < monthStart ? weekStart : monthStart,
    date_to: monthEnd > weekEnd ? monthEnd : weekEnd,
  });
  if (txError) return { data: null, error: txError };

  // 5. Compute spent per category per period
  const progress: BudgetProgress[] = budgets.map((budget) => {
    const periodStart = budget.period === 'monthly' ? monthStart : weekStart;
    const periodEnd = budget.period === 'monthly' ? monthEnd : weekEnd;

    const spent = (transactions ?? [])
      .filter((t) => {
        if (t.category_id !== budget.category_id) return false;
        return t.date >= periodStart && t.date <= periodEnd;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const remaining = Math.max(budget.amount - spent, 0);
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    let status: BudgetStatus = 'on_track';
    if (percentage >= 100) {
      status = 'exceeded';
    } else if (percentage >= budget.alert_threshold * 100) {
      status = 'warning';
    }

    const category = categoryMap.get(budget.category_id) ?? null;

    return {
      budget: { ...budget, category },
      spent,
      remaining,
      percentage,
      status,
    };
  });

  return { data: progress, error: null };
}


