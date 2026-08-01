-- ============================================
-- LOANS FEATURE - DATABASE SCHEMA
-- ============================================
-- Adds lending/borrowing tracking capability.
-- Run this after 001_initial_schema.sql.
-- ============================================

-- ============================================
-- 1. LOANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  counterparty_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lent', 'borrowed')),
  principal_amount DECIMAL(12, 2) NOT NULL CHECK (principal_amount > 0),
  outstanding_amount DECIMAL(12, 2) NOT NULL CHECK (outstanding_amount >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'partially_paid', 'settled')),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_status ON public.loans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_user_type ON public.loans(user_id, type);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loans"
  ON public.loans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loans"
  ON public.loans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loans"
  ON public.loans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own loans"
  ON public.loans FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 2. LOAN_TRANSACTIONS JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.loan_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('disbursement', 'repayment')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(loan_id, transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_loan_transactions_loan ON public.loan_transactions(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_transactions_txn ON public.loan_transactions(transaction_id);

ALTER TABLE public.loan_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loan_transactions"
  ON public.loan_transactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.loans WHERE loans.id = loan_transactions.loan_id AND loans.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own loan_transactions"
  ON public.loan_transactions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.loans WHERE loans.id = loan_transactions.loan_id AND loans.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own loan_transactions"
  ON public.loan_transactions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.loans WHERE loans.id = loan_transactions.loan_id AND loans.user_id = auth.uid())
  );

CREATE POLICY "Users can update own loan_transactions"
  ON public.loan_transactions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.loans WHERE loans.id = loan_transactions.loan_id AND loans.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.loans WHERE loans.id = loan_transactions.loan_id AND loans.user_id = auth.uid())
  );

-- ============================================
-- 3. AUTO-UPDATE updated_at FOR LOANS
-- ============================================
CREATE TRIGGER set_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 4. EXTEND TRANSACTIONS TYPE CHECK
-- ============================================
-- Drop existing check and re-add with lent/borrowed types
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('income', 'expense', 'lent', 'borrowed'));

