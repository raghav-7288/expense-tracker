export type TransactionType = 'income' | 'expense';

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

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  notes: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
}

export interface CreateTransactionInput {
  user_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string | null;
  date: string;
}

export interface UpdateTransactionInput {
  category_id?: string | null;
  type?: TransactionType;
  amount?: number;
  description?: string;
  notes?: string | null;
  date?: string;
}

export interface CreateCategoryInput {
  user_id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
  icon?: string;
}

export interface UpdateProfileInput {
  full_name?: string | null;
  avatar_url?: string | null;
  currency?: string;
}

export interface TransactionFilters {
  type?: TransactionType | 'all';
  category_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: 'date' | 'amount';
  sort_order?: 'asc' | 'desc';
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

