-- ============================================
-- AUDIT FOLLOW-UPS
-- ============================================
-- Applies fixes identified in the production readiness audit
-- (see DATABASE_PRODUCTION_AUDIT.md).
-- Safe to run multiple times (idempotent).
-- ============================================

-- --------------------------------------------
-- M2: Index the last unindexed foreign key.
-- user_categories.source_category_id references system_categories(id)
-- with ON DELETE SET NULL. Without an index, deleting a system category
-- forces a sequential scan of user_categories to enforce the rule.
-- Partial index keeps it small (most rows have NULL source).
-- --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_categories_source_category
  ON public.user_categories (source_category_id)
  WHERE source_category_id IS NOT NULL;

-- --------------------------------------------
-- H1 (safety net): ensure user-scoping FKs to auth.users exist with
-- ON DELETE CASCADE. These are declared in earlier migrations; the
-- guards below are no-ops if the constraints are already present.
-- Uncomment and run only if the H1 verification query shows a missing FK.
-- --------------------------------------------
-- ALTER TABLE public.transactions
--   ADD CONSTRAINT transactions_user_id_fkey
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE public.loans
--   ADD CONSTRAINT loans_user_id_fkey
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE public.accounts
--   ADD CONSTRAINT accounts_user_id_fkey
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE public.user_categories
--   ADD CONSTRAINT user_categories_user_id_fkey
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

