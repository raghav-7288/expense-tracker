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

/** Compute balances for all user accounts. */
export async function getAllAccountBalances(userId: string): Promise<{ data: Array<{ account: Account; balance: number }> | null; error: unknown }> {
  const { data: accounts, error: accError } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (accError || !accounts) return { data: null, error: accError };

  // Fetch all transactions for this user that have an account_id
  const { data: transactions, error: txnError } = await supabase
    .from('transactions')
    .select('account_id, type, amount')
    .eq('user_id', userId)
    .not('account_id', 'is', null);

  if (txnError) return { data: null, error: txnError };

  // Group by account_id
  const balanceMap = new Map<string, { income: number; expenses: number }>();
  for (const txn of transactions ?? []) {
    const accId = txn.account_id as string;
    if (!balanceMap.has(accId)) {
      balanceMap.set(accId, { income: 0, expenses: 0 });
    }
    const entry = balanceMap.get(accId)!;
    if (txn.type === 'income') {
      entry.income += Number(txn.amount);
    } else {
      entry.expenses += Number(txn.amount);
    }
  }

  const result = (accounts as Account[]).map((account) => {
    const txns = balanceMap.get(account.id) ?? { income: 0, expenses: 0 };
    const balance = (Number(account.initial_balance) || 0) + txns.income - txns.expenses;
    return { account, balance };
  });

  return { data: result, error: null };
}
