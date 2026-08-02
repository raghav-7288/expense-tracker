export type TransactionType = 'income' | 'expense' | 'lent' | 'borrowed';

export type AccountType = 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'other';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

/** System category (global, immutable) */
export interface SystemCategory {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

/** User-created custom category */
export interface UserCategory {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  source_category_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Merged category as displayed in the UI */
export interface MergedCategory {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  source: 'system' | 'user';
  isDefault: boolean;
  isCustom: boolean;
  editable: boolean;
  deletable: boolean;
  source_category_id: string | null;
}

export type CategorySource = 'system' | 'user';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  color: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountInput {
  user_id: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  color?: string;
  icon?: string;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  initial_balance?: number;
  color?: string;
  icon?: string;
  is_active?: boolean;
  sort_order?: number;
}

/** Loan linkage info attached to a transaction (if it's tied to a loan). */
export interface TransactionLoanInfo {
  loan_id: string;
  event_type: LoanEventType;
  loan?: Loan | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  account_id: string | null;
  type: TransactionType;
  amount: number;
  notes: string;
  date: string;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
  account?: { id: string; name: string; color: string } | null;
  /** Present when the transaction is linked to a loan (disbursement or repayment). */
  loan_info?: TransactionLoanInfo | null;
  /** Set when this transaction was generated from a recurring rule. */
  recurring_id?: string | null;
}

export interface CreateTransactionInput {
  user_id: string;
  category_id: string | null;
  account_id?: string | null;
  type: TransactionType;
  amount: number;
  notes: string;
  date: string;
}

export interface UpdateTransactionInput {
  category_id?: string | null;
  account_id?: string | null;
  type?: TransactionType;
  amount?: number;
  notes?: string;
  date?: string;
}

// ============================================
// RECURRING TRANSACTIONS
// ============================================

export type RecurrenceFrequency = 'weekly' | 'monthly' | 'yearly';

/** Only income/expense can recur — loans have their own disbursement flow. */
export type RecurringTransactionType = Extract<TransactionType, 'income' | 'expense'>;

export interface RecurringTransaction {
  id: string;
  user_id: string;
  type: RecurringTransactionType;
  amount: number;
  notes: string;
  /** Merged category id (system or user) — resolved by the service layer. */
  category_id: string | null;
  account_id: string | null;
  frequency: RecurrenceFrequency;
  start_date: string;
  /** null = repeats indefinitely */
  end_date: string | null;
  next_due_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
  account?: { id: string; name: string; color: string } | null;
}

export interface CreateRecurringTransactionInput {
  user_id: string;
  type: RecurringTransactionType;
  amount: number;
  notes: string;
  category_id?: string | null;
  account_id?: string | null;
  frequency: RecurrenceFrequency;
  start_date: string;
  end_date?: string | null;
}

export interface UpdateRecurringTransactionInput {
  type?: RecurringTransactionType;
  amount?: number;
  notes?: string;
  category_id?: string | null;
  account_id?: string | null;
  frequency?: RecurrenceFrequency;
  start_date?: string;
  end_date?: string | null;
  next_due_date?: string;
  is_active?: boolean;
}

export interface CreateCategoryInput {
  user_id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  source_category_id?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
  icon?: string;
}

export interface HiddenCategory {
  user_id: string;
  category_id: string;
  hidden_at: string;
}

export type CategoryFilter = 'all' | 'expense' | 'income' | 'custom' | 'default';

export interface UpdateProfileInput {
  full_name?: string | null;
  avatar_url?: string | null;
  currency?: string;
}

export interface TransactionFilters {
  type?: TransactionType | 'all';
  category_id?: string;
  account_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: 'date' | 'amount' | 'notes';
  sort_order?: 'asc' | 'desc';
  limit?: number;
}

export interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryBreakdown {
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

// ============================================
// LOANS
// ============================================

export type LoanType = 'lent' | 'borrowed';
export type LoanStatus = 'active' | 'partially_paid' | 'settled';
export type LoanEventType = 'disbursement' | 'repayment';

export interface Loan {
  id: string;
  user_id: string;
  counterparty_name: string;
  type: LoanType;
  principal_amount: number;
  outstanding_amount: number;
  status: LoanStatus;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLoanInput {
  user_id: string;
  counterparty_name: string;
  type: LoanType;
  principal_amount: number;
  outstanding_amount: number;
  status?: LoanStatus;
  due_date?: string | null;
  notes?: string | null;
  account_id?: string | null;
}

export interface UpdateLoanInput {
  counterparty_name?: string;
  due_date?: string | null;
  notes?: string | null;
  outstanding_amount?: number;
  status?: LoanStatus;
}

export interface LoanTransaction {
  id: string;
  loan_id: string;
  transaction_id: string;
  event_type: LoanEventType;
  created_at: string;
  transaction?: Transaction;
}

export interface RecordRepaymentInput {
  loan_id: string;
  amount: number;
  date: string;
  notes?: string;
  account_id?: string | null;
}

export interface LoanFilters {
  type?: LoanType | 'all';
  status?: LoanStatus | 'all';
  search?: string;
}

export interface LoanSummary {
  totalLent: number;
  totalBorrowed: number;
  outstandingLent: number;
  outstandingBorrowed: number;
  netReceivable: number;
  activeLoansCount: number;
  settledLoansCount: number;
}
