-- ============================================
-- RECURRING TRANSACTIONS - DATABASE SCHEMA
-- ============================================
-- Adds the ability to schedule a transaction to repeat on a
-- weekly / monthly / yearly cadence. A "rule" row lives in
-- recurring_transactions; actual transactions are materialized from
-- it (client-side generator) and linked back via transactions.recurring_id.
-- Run this after 010_audit_followups.sql. Idempotent.
-- ============================================

-- ============================================
-- 1. RECURRING_TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Template fields (copied onto each generated transaction)
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  notes TEXT NOT NULL,
  system_category_id UUID REFERENCES public.system_categories(id) ON DELETE SET NULL,
  user_category_id UUID REFERENCES public.user_categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,

  -- Recurrence definition
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,                                   -- NULL = repeat indefinitely
  next_due_date DATE NOT NULL,                     -- next date a transaction should be generated
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- end_date, when provided, must not precede the start
  CONSTRAINT recurring_end_after_start CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON public.recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user_active ON public.recurring_transactions(user_id, is_active);
-- Partial index powers the generator query (find rules that are due).
CREATE INDEX IF NOT EXISTS idx_recurring_due ON public.recurring_transactions(next_due_date) WHERE is_active = true;

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring transactions"
  ON public.recurring_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring transactions"
  ON public.recurring_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring transactions"
  ON public.recurring_transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring transactions"
  ON public.recurring_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS set_recurring_transactions_updated_at ON public.recurring_transactions;
CREATE TRIGGER set_recurring_transactions_updated_at
  BEFORE UPDATE ON public.recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 2. LINK GENERATED TRANSACTIONS BACK TO THEIR RULE
-- ============================================
-- ON DELETE SET NULL: deleting a rule keeps already-generated
-- transactions intact, it just severs the link.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS recurring_id UUID REFERENCES public.recurring_transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON public.transactions(recurring_id);

