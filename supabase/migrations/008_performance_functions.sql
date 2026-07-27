-- ============================================
-- PERFORMANCE: Server-Side Aggregation Functions
-- ============================================
-- 1. Dashboard balance summary (eliminates full transaction fetch)
-- 2. Full-text search with trigram index (10-100x faster search)
-- 3. Account balance aggregation (eliminates N+1 pattern)
-- ============================================

-- ============================================
-- 1. DASHBOARD BALANCE SUMMARY FUNCTION
-- ============================================
-- Returns total_income, total_expenses, monthly_income, monthly_expenses
-- in a single query instead of fetching the entire transaction history.

CREATE OR REPLACE FUNCTION public.get_balance_summary(uid UUID)
RETURNS TABLE (
  total_income NUMERIC,
  total_expenses NUMERIC,
  monthly_income NUMERIC,
  monthly_expenses NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  month_start DATE;
  month_end DATE;
BEGIN
  month_start := date_trunc('month', CURRENT_DATE)::DATE;
  month_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expenses,
    COALESCE(SUM(CASE WHEN t.type = 'income' AND t.date >= month_start AND t.date <= month_end THEN t.amount ELSE 0 END), 0) AS monthly_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.date >= month_start AND t.date <= month_end THEN t.amount ELSE 0 END), 0) AS monthly_expenses
  FROM public.transactions t
  WHERE t.user_id = uid;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_balance_summary(UUID) TO authenticated;

-- ============================================
-- 2. FULL-TEXT SEARCH WITH TRIGRAM INDEX
-- ============================================
-- Enable pg_trgm extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index on transactions.notes for fast ILIKE / trigram searches
CREATE INDEX IF NOT EXISTS idx_transactions_notes_trgm
  ON public.transactions
  USING GIN (notes gin_trgm_ops);

-- ============================================
-- 3. ACCOUNT BALANCE SQL AGGREGATION FUNCTION
-- ============================================
-- Returns all active accounts with their computed balances
-- using a single GROUP BY query instead of N+1 fetches.

CREATE OR REPLACE FUNCTION public.get_account_balances(uid UUID)
RETURNS TABLE (
  account_id UUID,
  account_name TEXT,
  account_type TEXT,
  initial_balance NUMERIC,
  color TEXT,
  icon TEXT,
  is_active BOOLEAN,
  sort_order INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  computed_balance NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS account_id,
    a.name AS account_name,
    a.type AS account_type,
    a.initial_balance,
    a.color,
    a.icon,
    a.is_active,
    a.sort_order,
    a.created_at,
    a.updated_at,
    (
      COALESCE(a.initial_balance, 0)
      + COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
    ) AS computed_balance
  FROM public.accounts a
  LEFT JOIN public.transactions t ON t.account_id = a.id
  WHERE a.user_id = uid
    AND a.is_active = true
  GROUP BY a.id, a.name, a.type, a.initial_balance, a.color, a.icon, a.is_active, a.sort_order, a.created_at, a.updated_at
  ORDER BY a.sort_order ASC, a.created_at ASC;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_account_balances(UUID) TO authenticated;

