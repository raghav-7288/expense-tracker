import { supabase } from '@/lib/supabase';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
} from '@/types';

// Select with joined category info from both system and user tables
const TRANSACTION_SELECT = `
  *,
  system_cat:system_categories(id, name, color, icon),
  user_cat:user_categories(id, name, color, icon)
`;

/** Normalize the joined category into the flat `categories` shape the UI expects. */
function normalizeTransaction(row: Record<string, unknown>): Transaction {
  const systemCat = row.system_cat as { id: string; name: string; color: string; icon: string } | null;
  const userCat = row.user_cat as { id: string; name: string; color: string; icon: string } | null;
  const cat = systemCat ?? userCat ?? null;

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    category_id: (row.system_category_id ?? row.user_category_id ?? row.category_id ?? null) as string | null,
    type: row.type as Transaction['type'],
    amount: row.amount as number,
    description: row.description as string,
    notes: (row.notes ?? null) as string | null,
    date: row.date as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    categories: cat ? {
      id: cat.id,
      user_id: row.user_id as string,
      name: cat.name,
      type: row.type as Transaction['type'],
      color: cat.color,
      icon: cat.icon,
      created_at: '',
      updated_at: '',
    } : null,
  };
}

export async function getTransactions(userId: string, filters?: TransactionFilters) {
  let query = supabase
    .from('transactions')
    .select(TRANSACTION_SELECT)
    .eq('user_id', userId);

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }

  if (filters?.category_id) {
    // Search across both category FK columns
    query = query.or(`system_category_id.eq.${filters.category_id},user_category_id.eq.${filters.category_id}`);
  }

  if (filters?.date_from) {
    query = query.gte('date', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('date', filters.date_to);
  }

  if (filters?.search) {
    query = query.ilike('description', `%${filters.search}%`);
  }

  const sortBy = filters?.sort_by === 'amount' ? 'amount' : 'date';
  const ascending = filters?.sort_order === 'asc';
  query = query.order(sortBy, { ascending });

  if (sortBy !== 'date') {
    query = query.order('date', { ascending: false });
  }

  const { data, error } = await query;
  if (error || !data) return { data: null, error };
  return { data: (data as Record<string, unknown>[]).map(normalizeTransaction), error: null };
}

export async function getTransaction(id: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select(TRANSACTION_SELECT)
    .eq('id', id)
    .single();

  if (error || !data) return { data: null, error };
  return { data: normalizeTransaction(data as Record<string, unknown>), error: null };
}

/**
 * Resolve a category_id to the correct FK column.
 * Checks system_categories first, then user_categories.
 */
async function resolveCategoryColumns(categoryId: string | null | undefined) {
  if (!categoryId) {
    return { system_category_id: null, user_category_id: null, category_id: null };
  }

  // Check if it's a system category
  const { data: sysCat } = await supabase
    .from('system_categories')
    .select('id')
    .eq('id', categoryId)
    .maybeSingle();

  if (sysCat) {
    return { system_category_id: categoryId, user_category_id: null, category_id: categoryId };
  }

  // Must be a user category
  return { system_category_id: null, user_category_id: categoryId, category_id: categoryId };
}

export async function createTransaction(input: CreateTransactionInput) {
  const categoryColumns = await resolveCategoryColumns(input.category_id);

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: input.user_id,
      type: input.type,
      amount: input.amount,
      description: input.description,
      notes: input.notes ?? null,
      date: input.date,
      ...categoryColumns,
    })
    .select(TRANSACTION_SELECT)
    .single();

  if (error || !data) return { data: null, error };
  return { data: normalizeTransaction(data as Record<string, unknown>), error: null };
}

export async function updateTransaction(id: string, input: UpdateTransactionInput) {
  const updateData: Record<string, unknown> = {};
  if (input.type !== undefined) updateData.type = input.type;
  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.date !== undefined) updateData.date = input.date;

  if (input.category_id !== undefined) {
    const categoryColumns = await resolveCategoryColumns(input.category_id);
    Object.assign(updateData, categoryColumns);
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .select(TRANSACTION_SELECT)
    .single();

  if (error || !data) return { data: null, error };
  return { data: normalizeTransaction(data as Record<string, unknown>), error: null };
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  return { error };
}

export async function getMonthlyStats(userId: string, year: number) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount, date')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  return { data, error };
}
