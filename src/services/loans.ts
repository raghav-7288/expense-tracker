import { supabase } from '@/lib/supabase';
import type {
  Loan,
  CreateLoanInput,
  UpdateLoanInput,
  LoanTransaction,
  LoanFilters,
  LoanSummary,
  RecordRepaymentInput,
} from '@/types';

const LOAN_SELECT = `*`;

const LOAN_TRANSACTION_SELECT = `
  *,
  transaction:transactions(id, type, amount, notes, date, account_id)
`;

export async function getLoans(userId: string, filters?: LoanFilters) {
  let query = supabase
    .from('loans')
    .select(LOAN_SELECT)
    .eq('user_id', userId);

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    const sanitized = filters.search.replace(/[%_\\]/g, (ch) => `\\${ch}`);
    query = query.ilike('counterparty_name', `%${sanitized}%`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) return { data: null, error };
  return { data: data as Loan[], error: null };
}

export async function getLoan(id: string) {
  const { data, error } = await supabase
    .from('loans')
    .select(LOAN_SELECT)
    .eq('id', id)
    .single();

  if (error || !data) return { data: null, error };
  return { data: data as Loan, error: null };
}

export async function createLoan(input: CreateLoanInput) {
  const { account_id, ...loanData } = input;

  // 1. Create the loan record
  const { data: loan, error: loanError } = await supabase
    .from('loans')
    .insert({
      user_id: loanData.user_id,
      counterparty_name: loanData.counterparty_name,
      type: loanData.type,
      principal_amount: loanData.principal_amount,
      outstanding_amount: loanData.outstanding_amount,
      status: loanData.status ?? 'active',
      due_date: loanData.due_date ?? null,
      notes: loanData.notes ?? null,
    })
    .select()
    .single();

  if (loanError || !loan) return { data: null, error: loanError };

  // 2. Create the disbursement transaction
  const transactionType = loanData.type; // 'lent' or 'borrowed'
  const notes = loanData.type === 'lent'
    ? `Lent to ${loanData.counterparty_name}`
    : `Borrowed from ${loanData.counterparty_name}`;

  const { data: txn, error: txnError } = await supabase
    .from('transactions')
    .insert({
      user_id: loanData.user_id,
      type: transactionType,
      amount: loanData.principal_amount,
      notes,
      date: new Date().toISOString().split('T')[0],
      account_id: account_id ?? null,
    })
    .select()
    .single();

  if (txnError || !txn) {
    // Rollback loan creation on transaction failure
    await supabase.from('loans').delete().eq('id', (loan as Loan).id);
    return { data: null, error: txnError };
  }

  // 3. Link loan ↔ transaction
  const { error: linkError } = await supabase.from('loan_transactions').insert({
    loan_id: (loan as Loan).id,
    transaction_id: (txn as { id: string }).id,
    event_type: 'disbursement',
  });

  if (linkError) {
    // Rollback both loan and transaction on link failure
    await supabase.from('transactions').delete().eq('id', (txn as { id: string }).id);
    await supabase.from('loans').delete().eq('id', (loan as Loan).id);
    return { data: null, error: linkError };
  }

  return { data: loan as Loan, error: null };
}

export async function updateLoan(id: string, input: UpdateLoanInput) {
  const { data, error } = await supabase
    .from('loans')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return { data: null, error };
  return { data: data as Loan, error: null };
}

export async function deleteLoan(id: string) {
  // First delete linked transactions
  const { data: links } = await supabase
    .from('loan_transactions')
    .select('transaction_id')
    .eq('loan_id', id);

  if (links && links.length > 0) {
    const txnIds = links.map((l) => (l as { transaction_id: string }).transaction_id);
    await supabase.from('transactions').delete().in('id', txnIds);
  }

  const { error } = await supabase
    .from('loans')
    .delete()
    .eq('id', id);

  return { error };
}

export async function recordRepayment(input: RecordRepaymentInput) {
  // 1. Get the loan
  const { data: loan, error: loanError } = await supabase
    .from('loans')
    .select('*')
    .eq('id', input.loan_id)
    .single();

  if (loanError || !loan) return { data: null, error: loanError };

  const typedLoan = loan as Loan;

  // Guard: cannot repay a settled loan
  if (typedLoan.status === 'settled' || typedLoan.outstanding_amount <= 0) {
    return { data: null, error: { message: 'This loan is already settled' } };
  }

  const repaymentAmount = Math.min(input.amount, typedLoan.outstanding_amount);
  const newOutstanding = typedLoan.outstanding_amount - repaymentAmount;
  const newStatus = newOutstanding <= 0 ? 'settled' : 'partially_paid';

  // 2. Create repayment transaction
  // If the loan was "lent", repayment is money coming back (income-like but we use 'borrowed' type reversed)
  // Actually: if you lent money, repayment = income. If you borrowed, repayment = expense.
  const transactionType = typedLoan.type === 'lent' ? 'income' : 'expense';
  const notes = input.notes
    ?? (typedLoan.type === 'lent'
      ? `Repayment from ${typedLoan.counterparty_name}`
      : `Repaid to ${typedLoan.counterparty_name}`);

  const { data: txn, error: txnError } = await supabase
    .from('transactions')
    .insert({
      user_id: typedLoan.user_id,
      type: transactionType,
      amount: repaymentAmount,
      notes,
      date: input.date,
      account_id: input.account_id ?? null,
    })
    .select()
    .single();

  if (txnError || !txn) return { data: null, error: txnError };

  // 3. Link to loan
  const { error: linkError } = await supabase.from('loan_transactions').insert({
    loan_id: input.loan_id,
    transaction_id: (txn as { id: string }).id,
    event_type: 'repayment',
  });

  if (linkError) {
    // Rollback: delete the orphan transaction
    await supabase.from('transactions').delete().eq('id', (txn as { id: string }).id);
    return { data: null, error: linkError };
  }

  // 4. Update loan outstanding & status
  const { data: updatedLoan, error: updateError } = await supabase
    .from('loans')
    .update({
      outstanding_amount: Math.max(0, newOutstanding),
      status: newStatus,
    })
    .eq('id', input.loan_id)
    .select()
    .single();

  if (updateError) return { data: null, error: updateError };
  return { data: updatedLoan as Loan, error: null };
}

export async function getLoanTransactions(loanId: string) {
  const { data, error } = await supabase
    .from('loan_transactions')
    .select(LOAN_TRANSACTION_SELECT)
    .eq('loan_id', loanId)
    .order('created_at', { ascending: true });

  if (error) return { data: null, error };
  return { data: data as LoanTransaction[], error: null };
}

export async function getLoanSummary(userId: string): Promise<{ data: LoanSummary | null; error: unknown }> {
  const { data, error } = await supabase
    .from('loans')
    .select('type, principal_amount, outstanding_amount, status')
    .eq('user_id', userId);

  if (error) return { data: null, error };

  const loans = (data ?? []) as Array<{
    type: string;
    principal_amount: number;
    outstanding_amount: number;
    status: string;
  }>;

  const summary: LoanSummary = {
    totalLent: 0,
    totalBorrowed: 0,
    outstandingLent: 0,
    outstandingBorrowed: 0,
    netReceivable: 0,
    activeLoansCount: 0,
    settledLoansCount: 0,
  };

  for (const loan of loans) {
    if (loan.type === 'lent') {
      summary.totalLent += Number(loan.principal_amount);
      summary.outstandingLent += Number(loan.outstanding_amount);
    } else {
      summary.totalBorrowed += Number(loan.principal_amount);
      summary.outstandingBorrowed += Number(loan.outstanding_amount);
    }
    if (loan.status === 'settled') {
      summary.settledLoansCount++;
    } else {
      summary.activeLoansCount++;
    }
  }

  summary.netReceivable = summary.outstandingLent - summary.outstandingBorrowed;
  return { data: summary, error: null };
}

