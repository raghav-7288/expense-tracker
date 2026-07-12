import { supabase } from '@/lib/supabase';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
} from '@/types';

export async function getTransactions(userId: string, filters?: TransactionFilters) {
  let query = supabase
    .from('transactions')
    .select('*, categories(id, name, color, icon)')
    .eq('user_id', userId);

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
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
  return { data: data as Transaction[] | null, error };
}

export async function getTransaction(id: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(id, name, color, icon)')
    .eq('id', id)
    .single();

  return { data: data as Transaction | null, error };
}

export async function createTransaction(input: CreateTransactionInput) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(input)
    .select('*, categories(id, name, color, icon)')
    .single();

  return { data: data as Transaction | null, error };
}

export async function updateTransaction(id: string, input: UpdateTransactionInput) {
  const { data, error } = await supabase
    .from('transactions')
    .update(input)
    .eq('id', id)
    .select('*, categories(id, name, color, icon)')
    .single();

  return { data: data as Transaction | null, error };
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

