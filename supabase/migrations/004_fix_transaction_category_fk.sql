-- Migration 004: Fix transactions category foreign key
-- Problem: transactions.category_id references old 'categories' table,
-- but the app now uses system_categories + user_categories.
-- Solution: Drop old FK, use category_id as a plain field,
-- and rely on system_category_id / user_category_id FKs.

-- 1. Drop the old FK constraint that references the legacy categories table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'transactions_category_id_fkey'
      AND table_name = 'transactions'
  ) THEN
    ALTER TABLE public.transactions DROP CONSTRAINT transactions_category_id_fkey;
  END IF;
END $$;

-- 2. Ensure system_category_id and user_category_id columns exist (from migration 002)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS system_category_id UUID REFERENCES public.system_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_category_id UUID REFERENCES public.user_categories(id) ON DELETE SET NULL;

-- 3. Backfill: for any transactions that have category_id but no system/user category ID,
-- try to match against system_categories first, then user_categories
UPDATE public.transactions t
SET system_category_id = sc.id
FROM public.system_categories sc
WHERE t.category_id = sc.id
  AND t.system_category_id IS NULL
  AND t.user_category_id IS NULL;

UPDATE public.transactions t
SET user_category_id = uc.id
FROM public.user_categories uc
WHERE t.category_id = uc.id
  AND t.system_category_id IS NULL
  AND t.user_category_id IS NULL;

-- 4. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_transactions_system_category ON public.transactions(system_category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_category_id);

