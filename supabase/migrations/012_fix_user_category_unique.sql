-- ============================================
-- FIX: USER CATEGORY UNIQUENESS VS SOFT DELETE
-- ============================================
-- Bug: user_categories had a plain UNIQUE(user_id, name, type) constraint,
-- but categories are SOFT-deleted (deleted_at is set; the row is kept so
-- historical transactions still resolve their category). A soft-deleted
-- "Test" therefore kept occupying the unique slot, so re-creating "Test"
-- failed with:
--   duplicate key value violates unique constraint
--   "user_categories_user_id_name_type_key"
--
-- Fix: uniqueness should only apply to ACTIVE (non-deleted) categories.
-- Replace the full constraint with a PARTIAL unique index that ignores
-- soft-deleted rows. After this:
--   * Re-creating the name of a deleted category succeeds (a fresh row is
--     inserted; the old soft-deleted row stays linked to its old txns).
--   * Two LIVE categories with the same name+type are still prevented — the
--     app now surfaces that as a friendly toast instead of a raw DB error.
--
-- Run after 011_recurring_transactions.sql. Idempotent.
-- ============================================

-- 1. Drop the old full constraint (Postgres auto-names UNIQUE(cols) as
--    <table>_<cols>_key). Safe if it was already removed.
ALTER TABLE public.user_categories
  DROP CONSTRAINT IF EXISTS user_categories_user_id_name_type_key;

-- 2. Enforce uniqueness only among LIVE categories. Soft-deleted rows
--    (deleted_at IS NOT NULL) are excluded, so a name can be reused after
--    its category is deleted.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_categories_active_name_type
  ON public.user_categories (user_id, name, type)
  WHERE deleted_at IS NULL;

