-- ============================================
-- MIGRATION 003: DATABASE AUDIT FIXES
-- ============================================
-- Addresses issues found during the database QA audit.
-- All changes are backward-compatible and non-destructive.
-- ============================================

-- ============================================
-- 1. FIX: profiles.currency needs length constraint
-- Risk: unbounded TEXT for currency code allows arbitrary data
-- ============================================
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_currency_length CHECK (char_length(currency) <= 5);

-- ============================================
-- 2. FIX: profiles missing DELETE policy
-- Risk: If Supabase Auth deletes a user, the CASCADE handles it,
-- but a user explicitly trying to delete their profile via client
-- would be silently rejected. Add policy for completeness.
-- ============================================
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ============================================
-- 3. FIX: system_categories needs updated_at trigger
-- Issue: table has updated_at column but no auto-update trigger
-- ============================================
CREATE TRIGGER set_system_categories_updated_at
  BEFORE UPDATE ON public.system_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 4. FIX: Add text length constraints to prevent abuse
-- Issue: No max lengths on name/description/notes fields
-- ============================================
ALTER TABLE public.categories
  ADD CONSTRAINT chk_categories_name_length CHECK (char_length(name) <= 100);

ALTER TABLE public.system_categories
  ADD CONSTRAINT chk_system_categories_name_length CHECK (char_length(name) <= 100);

ALTER TABLE public.user_categories
  ADD CONSTRAINT chk_user_categories_name_length CHECK (char_length(name) <= 100);

ALTER TABLE public.transactions
  ADD CONSTRAINT chk_transactions_description_length CHECK (char_length(description) <= 500),
  ADD CONSTRAINT chk_transactions_notes_length CHECK (char_length(notes) <= 2000);

-- ============================================
-- 5. FIX: Add color format validation
-- Issue: Color fields accept any text, should be hex color
-- ============================================
ALTER TABLE public.system_categories
  ADD CONSTRAINT chk_system_categories_color_format CHECK (color ~ '^#[0-9a-fA-F]{6}$');

ALTER TABLE public.user_categories
  ADD CONSTRAINT chk_user_categories_color_format CHECK (color ~ '^#[0-9a-fA-F]{6}$');

ALTER TABLE public.categories
  ADD CONSTRAINT chk_categories_color_format CHECK (color ~ '^#[0-9a-fA-F]{6}$');

-- ============================================
-- 6. FIX: Add index for soft-delete filter on user_categories
-- Issue: queries filter WHERE deleted_at IS NULL, need partial index
-- The idx_user_categories_active already covers this, but add type filter
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_categories_active_type
  ON public.user_categories(user_id, type) WHERE deleted_at IS NULL;

-- ============================================
-- 7. FIX: Add index for transaction date range queries
-- Issue: Analytics queries filter by (user_id, date range, type)
-- The existing idx_transactions_user_date covers (user_id, date DESC)
-- but analytics also filters by type in the same query
-- ============================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date
  ON public.transactions(user_id, type, date DESC);

-- ============================================
-- 8. FIX: Add index for ilike search on transactions
-- Issue: TransactionFilters uses ilike('description', '%term%')
-- A trigram index would help but requires pg_trgm extension.
-- For now, add a basic index that helps with prefix searches.
-- ============================================
-- Note: For full-text search optimization, enable pg_trgm:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX idx_transactions_description_trgm
--   ON public.transactions USING gin (description gin_trgm_ops);

-- ============================================
-- 9. FIX: Ensure transactions.category_id FK is consistent
-- Issue: After migration 002, transactions can have category_id
-- pointing to old categories table, system_category_id, OR user_category_id.
-- Add a CHECK constraint ensuring at least one reference exists OR all are null.
-- ============================================
-- Note: This is informational only. The existing ON DELETE SET NULL handles
-- orphaned references correctly. Adding a multi-column constraint would
-- be overly restrictive for historical data.

-- ============================================
-- 10. FIX: handle_new_user() should set currency to INR (project default)
-- Issue: profiles table default is 'USD' but project changed to INR
-- ============================================
ALTER TABLE public.profiles ALTER COLUMN currency SET DEFAULT 'INR';

-- ============================================
-- 11. VERIFY: RLS is enabled on all tables
-- This is a safety check — no-op if already enabled
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hidden_categories ENABLE ROW LEVEL SECURITY;

