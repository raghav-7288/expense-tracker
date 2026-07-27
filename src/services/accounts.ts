import { supabase } from '@/lib/supabase';
import type { Account, CreateAccountInput, UpdateAccountInput } from '@/types';

export async function getAccounts(userId: string) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  return { data: data as Account[] | null, error };
}

export async function getActiveAccounts(userId: string) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  return { data: data as Account[] | null, error };
}

export async function getAccount(id: string) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single();

  return { data: data as Account | null, error };
}

export async function createAccount(input: CreateAccountInput) {
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: input.user_id,
      name: input.name,
      type: input.type,
      initial_balance: input.initial_balance,
      color: input.color ?? '#3b82f6',
      icon: input.icon ?? 'wallet',
    })
    .select('*')
    .single();

  return { data: data as Account | null, error };
}

export async function updateAccount(id: string, input: UpdateAccountInput) {
  const { data, error } = await supabase
    .from('accounts')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();

  return { data: data as Account | null, error };
}

export async function deleteAccount(id: string) {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  return { error };
}

/** Compute current balance for a single account by summing transactions. */
export async function getAccountBalance(accountId: string): Promise<{ balance: number; error: unknown }> {
  // Get account initial balance
  const { data: account, error: accError } = await supabase
    .from('accounts')
    .select('initial_balance')
    .eq('id', accountId)
    .single();

  if (accError || !account) return { balance: 0, error: accError };

  // Sum income for this account
  const { data: incomeData } = await supabase
    .from('transactions')
    .select('amount')
    .eq('account_id', accountId)
    .eq('type', 'income');

  // Sum expenses for this account
  const { data: expenseData } = await supabase
    .from('transactions')
    .select('amount')
    .eq('account_id', accountId)
    .eq('type', 'expense');

  const totalIncome = (incomeData ?? []).reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = (expenseData ?? []).reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = (Number(account.initial_balance) || 0) + totalIncome - totalExpenses;

  return { balance, error: null };
}

/** Compute balances for all user accounts via server-side SQL aggregation. */
export async function getAllAccountBalances(userId: string): Promise<{ data: Array<{ account: Account; balance: number }> | null; error: unknown }> {
  const { data, error } = await supabase.rpc('get_account_balances', { uid: userId });

  if (error) return { data: null, error };

  const rows = (data ?? []) as Array<{
    account_id: string;
    account_name: string;
    account_type: string;
    initial_balance: number;
    color: string;
    icon: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
    computed_balance: number;
  }>;

  const result = rows.map((row) => ({
    account: {
      id: row.account_id,
      user_id: userId,
      name: row.account_name,
      type: row.account_type as Account['type'],
      initial_balance: Number(row.initial_balance),
      color: row.color,
      icon: row.icon,
      is_active: row.is_active,
      sort_order: row.sort_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    balance: Number(row.computed_balance),
  }));

  return { data: result, error: null };
}
