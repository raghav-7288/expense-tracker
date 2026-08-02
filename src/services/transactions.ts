import { supabase } from '@/lib/supabase';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  TransactionLoanInfo,
  Loan,
} from '@/types';

// Select with joined category info from both system and user tables, plus account and loan link
const TRANSACTION_SELECT = `
  *,
  system_cat:system_categories(id, name, color, icon),
  user_cat:user_categories(id, name, color, icon),
  account:accounts(id, name, color),
  loan_transactions(loan_id, event_type, loan:loans(*))
`;

/** Normalize the joined category, account, and loan_info into the flat shape the UI expects. */
function normalizeTransaction(row: Record<string, unknown>): Transaction {
  const systemCat = row.system_cat as { id: string; name: string; color: string; icon: string } | null;
  const userCat = row.user_cat as { id: string; name: string; color: string; icon: string } | null;
  const cat = systemCat ?? userCat ?? null;
  const account = row.account as { id: string; name: string; color: string } | null;

  // loan_transactions is an array (one-to-many from supabase join), take the first entry
  const loanLinks = row.loan_transactions as Array<{
    loan_id: string;
    event_type: 'disbursement' | 'repayment';
    loan: Loan | null;
  }> | null;
  const loanLink = loanLinks && loanLinks.length > 0 ? loanLinks[0] : null;

  const loanInfo: TransactionLoanInfo | null = loanLink
    ? { loan_id: loanLink.loan_id, event_type: loanLink.event_type, loan: loanLink.loan ?? null }
    : null;

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    category_id: (row.system_category_id ?? row.user_category_id ?? row.category_id ?? null) as string | null,
    account_id: (row.account_id ?? null) as string | null,
    type: row.type as Transaction['type'],
    amount: row.amount as number,
    notes: row.notes as string,
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
    account: account ?? null,
    loan_info: loanInfo,
    // Preserve the link to the recurring rule so the UI can render the 🔁 badge
    // and trace generated transactions back to their schedule.
    recurring_id: (row.recurring_id ?? null) as string | null,
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
    // Validate UUID format to prevent PostgREST filter injection
    const catId = filters.category_id;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catId)) {
      return { data: [], error: null };
    }
    // Search across both category FK columns
    query = query.or(`system_category_id.eq.${catId},user_category_id.eq.${catId}`);
  }

  if (filters?.date_from) {
    query = query.gte('date', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('date', filters.date_to);
  }

  if (filters?.account_id) {
    const accId = filters.account_id;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accId)) {
      return { data: [], error: null };
    }
    query = query.eq('account_id', accId);
  }

  if (filters?.search) {
    // Escape PostgREST/SQL LIKE wildcards in user input
    const sanitized = filters.search.replace(/[%_\\]/g, (ch) => `\\${ch}`);
    query = query.ilike('notes', `%${sanitized}%`);
  }

  const sortBy = filters?.sort_by === 'amount'
    ? 'amount'
    : filters?.sort_by === 'notes'
      ? 'notes'
      : 'date';
  const ascending = filters?.sort_order === 'asc';
  query = query.order(sortBy, { ascending });

  // Secondary sort: when primary is date, break ties with created_at (full timestamp);
  // for other primary sorts, fall back to newest-first by date then created_at.
  if (sortBy === 'date') {
    query = query.order('created_at', { ascending });
  } else {
    query = query.order('date', { ascending: false });
    query = query.order('created_at', { ascending: false });
  }

  // Apply server-side limit if specified (pagination/recent queries)
  if (filters?.limit && filters.limit > 0) {
    query = query.limit(filters.limit);
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
      notes: input.notes,
      date: input.date,
      account_id: input.account_id ?? null,
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
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.date !== undefined) updateData.date = input.date;
  if (input.account_id !== undefined) updateData.account_id = input.account_id;

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


/** Dashboard balance summary via server-side aggregation (single SQL query). */
export interface BalanceSummary {
  total_income: number;
  total_expenses: number;
  monthly_income: number;
  monthly_expenses: number;
}

export async function getBalanceSummary(userId: string) {
  const { data, error } = await supabase.rpc('get_balance_summary', { uid: userId });

  if (error) return { data: null, error };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return {
      data: { total_income: 0, total_expenses: 0, monthly_income: 0, monthly_expenses: 0 } as BalanceSummary,
      error: null,
    };
  }

  return {
    data: {
      total_income: Number(row.total_income),
      total_expenses: Number(row.total_expenses),
      monthly_income: Number(row.monthly_income),
      monthly_expenses: Number(row.monthly_expenses),
    } as BalanceSummary,
    error: null,
  };
}

// ============================================
// LOAN-LINKED TRANSACTION OPERATIONS
// ============================================

/**
 * Recalculate a loan's outstanding_amount from its linked transactions.
 * outstanding = principal - sum(repayment amounts)
 */
async function recalculateLoanOutstanding(loanId: string) {
  // Get the loan principal
  const { data: loan, error: loanError } = await supabase
    .from('loans')
    .select('principal_amount')
    .eq('id', loanId)
    .single();

  if (loanError || !loan) return { error: loanError };

  const principal = Number((loan as { principal_amount: number }).principal_amount);

  // Sum all repayment transaction amounts for this loan
  const { data: links, error: linksError } = await supabase
    .from('loan_transactions')
    .select('event_type, transaction:transactions(amount)')
    .eq('loan_id', loanId);

  if (linksError) return { error: linksError };

  const repaidTotal = (links ?? [])
    .filter((l) => (l as { event_type: string }).event_type === 'repayment')
    .reduce((sum, l) => {
      const txnArr = (l as unknown as { transaction: Array<{ amount: number }> | null }).transaction;
      const txn = Array.isArray(txnArr) ? txnArr[0] : txnArr;
      return sum + (txn ? Number(txn.amount) : 0);
    }, 0);

  const outstanding = Math.max(0, principal - repaidTotal);
  const status = outstanding <= 0 ? 'settled' : repaidTotal > 0 ? 'partially_paid' : 'active';

  const { error: updateError } = await supabase
    .from('loans')
    .update({ outstanding_amount: outstanding, status })
    .eq('id', loanId);

  return { error: updateError };
}

/**
 * Update a loan-linked transaction (repayment or disbursement) and sync
 * the parent loan's outstanding_amount/status.
 */
export async function updateLoanTransaction(
  id: string,
  input: UpdateTransactionInput,
  loanId: string,
) {
  // 1. Update the transaction itself
  const updateData: Record<string, unknown> = {};
  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.date !== undefined) updateData.date = input.date;
  if (input.account_id !== undefined) updateData.account_id = input.account_id;
  // Type is intentionally NOT changeable for loan transactions

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

  // 2. Recalculate the loan's outstanding from scratch
  const { error: recalcError } = await recalculateLoanOutstanding(loanId);
  if (recalcError) return { data: null, error: recalcError };

  return { data: normalizeTransaction(data as Record<string, unknown>), error: null };
}

/**
 * Delete a loan-linked transaction and sync the parent loan's outstanding_amount/status.
 * For disbursement transactions: also deletes the entire loan.
 * For repayment transactions: deletes the repayment and recalculates the loan.
 */
export async function deleteLoanTransaction(id: string, loanId: string, eventType: 'disbursement' | 'repayment') {
  if (eventType === 'disbursement') {
    // Deleting a disbursement means the whole loan should go — cascade via deleteLoan logic
    // First, fetch all transaction ids linked to this loan
    const { data: links, error: linksError } = await supabase
      .from('loan_transactions')
      .select('transaction_id')
      .eq('loan_id', loanId);

    if (linksError) return { error: linksError };

    // Delete all linked transactions
    if (links && links.length > 0) {
      const txnIds = (links as Array<{ transaction_id: string }>).map((l) => l.transaction_id);
      const { error: txnError } = await supabase.from('transactions').delete().in('id', txnIds);
      if (txnError) return { error: txnError };
    }

    // Delete the loan itself
    const { error } = await supabase.from('loans').delete().eq('id', loanId);
    return { error };
  }

  // Repayment: just delete the transaction, then recalculate the loan
  const { error: deleteError } = await supabase.from('transactions').delete().eq('id', id);
  if (deleteError) return { error: deleteError };

  const { error: recalcError } = await recalculateLoanOutstanding(loanId);
  return { error: recalcError };
}

