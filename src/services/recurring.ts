import { supabase } from '@/lib/supabase';
import { getToday } from '@/utils/formatDate';
import type {
  RecurringTransaction,
  CreateRecurringTransactionInput,
  UpdateRecurringTransactionInput,
  RecurrenceFrequency,
} from '@/types';

// Joined category info from both system and user tables, plus account.
const RECURRING_SELECT = `
  *,
  system_cat:system_categories(id, name, color, icon),
  user_cat:user_categories(id, name, color, icon),
  account:accounts(id, name, color)
`;

/** Normalize the joined category/account into the flat shape the UI expects. */
function normalizeRecurring(row: Record<string, unknown>): RecurringTransaction {
  const systemCat = row.system_cat as { id: string; name: string; color: string; icon: string } | null;
  const userCat = row.user_cat as { id: string; name: string; color: string; icon: string } | null;
  const cat = systemCat ?? userCat ?? null;
  const account = row.account as { id: string; name: string; color: string } | null;

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    type: row.type as RecurringTransaction['type'],
    amount: Number(row.amount),
    notes: row.notes as string,
    category_id: (row.system_category_id ?? row.user_category_id ?? null) as string | null,
    account_id: (row.account_id ?? null) as string | null,
    frequency: row.frequency as RecurrenceFrequency,
    start_date: row.start_date as string,
    end_date: (row.end_date ?? null) as string | null,
    next_due_date: row.next_due_date as string,
    is_active: row.is_active as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    categories: cat
      ? {
          id: cat.id,
          user_id: row.user_id as string,
          name: cat.name,
          type: row.type as RecurringTransaction['type'],
          color: cat.color,
          icon: cat.icon,
          created_at: '',
          updated_at: '',
        }
      : null,
    account: account ?? null,
  };
}

/**
 * Resolve a category_id to the correct FK column.
 * Checks system_categories first, then falls back to user_categories.
 * (Mirrors the resolver in services/transactions.ts.)
 */
async function resolveCategoryColumns(categoryId: string | null | undefined) {
  if (!categoryId) {
    return { system_category_id: null, user_category_id: null };
  }

  const { data: sysCat } = await supabase
    .from('system_categories')
    .select('id')
    .eq('id', categoryId)
    .maybeSingle();

  if (sysCat) {
    return { system_category_id: categoryId, user_category_id: null };
  }

  return { system_category_id: null, user_category_id: categoryId };
}

// ============================================
// DATE MATH (no external date lib in this project)
// ============================================

function parseISO(s: string): Date {
  const parts = s.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Add n calendar months, clamping the day to the last valid day of the target month. */
function addMonths(date: Date, n: number): Date {
  const day = date.getDate();
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setMonth(d.getMonth() + n);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

/** Advance a YYYY-MM-DD date string by one recurrence interval. */
export function advanceDate(dateStr: string, frequency: RecurrenceFrequency): string {
  const base = parseISO(dateStr);
  if (frequency === 'weekly') return toISO(addDays(base, 7));
  if (frequency === 'monthly') return toISO(addMonths(base, 1));
  return toISO(addMonths(base, 12)); // yearly
}

// ============================================
// CRUD
// ============================================

export async function getRecurringTransactions(userId: string) {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select(RECURRING_SELECT)
    .eq('user_id', userId)
    .order('is_active', { ascending: false })
    .order('next_due_date', { ascending: true });

  if (error || !data) return { data: null, error };
  return { data: (data as Record<string, unknown>[]).map(normalizeRecurring), error: null };
}

export async function createRecurringTransaction(input: CreateRecurringTransactionInput) {
  const categoryColumns = await resolveCategoryColumns(input.category_id);

  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert({
      user_id: input.user_id,
      type: input.type,
      amount: input.amount,
      notes: input.notes,
      account_id: input.account_id ?? null,
      frequency: input.frequency,
      start_date: input.start_date,
      end_date: input.end_date ?? null,
      // The first occurrence is due on the start date.
      next_due_date: input.start_date,
      is_active: true,
      ...categoryColumns,
    })
    .select(RECURRING_SELECT)
    .single();

  if (error || !data) return { data: null, error };
  return { data: normalizeRecurring(data as Record<string, unknown>), error: null };
}

export async function updateRecurringTransaction(id: string, input: UpdateRecurringTransactionInput) {
  const updateData: Record<string, unknown> = {};
  if (input.type !== undefined) updateData.type = input.type;
  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.account_id !== undefined) updateData.account_id = input.account_id;
  if (input.frequency !== undefined) updateData.frequency = input.frequency;
  if (input.start_date !== undefined) updateData.start_date = input.start_date;
  if (input.end_date !== undefined) updateData.end_date = input.end_date;
  if (input.next_due_date !== undefined) updateData.next_due_date = input.next_due_date;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  if (input.category_id !== undefined) {
    const categoryColumns = await resolveCategoryColumns(input.category_id);
    Object.assign(updateData, categoryColumns);
  }

  const { data, error } = await supabase
    .from('recurring_transactions')
    .update(updateData)
    .eq('id', id)
    .select(RECURRING_SELECT)
    .single();

  if (error || !data) return { data: null, error };
  return { data: normalizeRecurring(data as Record<string, unknown>), error: null };
}

export async function deleteRecurringTransaction(id: string) {
  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id);

  return { error };
}

// ============================================
// GENERATION
// ============================================

// Safety cap so a malformed rule can never spin into an unbounded loop.
const MAX_OCCURRENCES_PER_RULE = 366;

/**
 * Materialize any transactions that are due from the user's active recurring
 * rules. Safe to call on every app load — it only creates transactions whose
 * next_due_date has arrived (including any that were missed while the app was
 * closed), then advances each rule's cursor. Deactivates rules that pass their
 * end_date. Returns the number of transactions generated.
 */
export async function generateDueTransactions(
  userId: string,
): Promise<{ generated: number; error: unknown }> {
  const today = getToday();

  const { data: rules, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .lte('next_due_date', today);

  if (error) return { generated: 0, error };
  if (!rules || rules.length === 0) return { generated: 0, error: null };

  let generated = 0;

  for (const rule of rules as Array<Record<string, unknown>>) {
    const ruleId = rule.id as string;
    const frequency = rule.frequency as RecurrenceFrequency;
    const endDate = (rule.end_date ?? null) as string | null;

    const toInsert: Array<Record<string, unknown>> = [];
    let dueDate = rule.next_due_date as string;
    let active = true;
    let iterations = 0;

    // Comparing YYYY-MM-DD strings lexicographically is chronologically correct.
    while (dueDate <= today && iterations < MAX_OCCURRENCES_PER_RULE) {
      if (endDate && dueDate > endDate) {
        active = false;
        break;
      }

      toInsert.push({
        user_id: userId,
        type: rule.type,
        amount: rule.amount,
        notes: rule.notes,
        date: dueDate,
        account_id: rule.account_id ?? null,
        system_category_id: rule.system_category_id ?? null,
        user_category_id: rule.user_category_id ?? null,
        recurring_id: ruleId,
      });

      dueDate = advanceDate(dueDate, frequency);
      iterations++;

      // The rule has reached the end of its schedule.
      if (endDate && dueDate > endDate) {
        active = false;
        break;
      }
    }

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase.from('transactions').insert(toInsert);
      if (insertError) return { generated, error: insertError };
      generated += toInsert.length;
    }

    // Advance the rule's cursor (and deactivate it if the schedule has ended).
    const { error: updateError } = await supabase
      .from('recurring_transactions')
      .update({ next_due_date: dueDate, is_active: active })
      .eq('id', ruleId);
    if (updateError) return { generated, error: updateError };
  }

  return { generated, error: null };
}

