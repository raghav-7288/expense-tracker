-- ============================================
-- CATEGORY SYSTEM REFACTOR
-- ============================================
-- Introduces:
--   1. system_categories (global, immutable defaults)
--   2. user_categories (per-user custom categories)
--   3. user_hidden_categories (hide defaults without deleting)
-- ============================================

-- ============================================
-- 1. SYSTEM CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT NOT NULL DEFAULT 'tag',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, type)
);

-- Everyone can read system categories, nobody can modify
ALTER TABLE public.system_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view system categories"
  ON public.system_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- No INSERT/UPDATE/DELETE policies = no user can modify

-- Seed system categories
INSERT INTO public.system_categories (name, type, color, icon) VALUES
  ('Food & Dining', 'expense', '#ef4444', 'utensils'),
  ('Transportation', 'expense', '#f59e0b', 'car'),
  ('Shopping', 'expense', '#8b5cf6', 'shopping-bag'),
  ('Entertainment', 'expense', '#ec4899', 'film'),
  ('Bills & Utilities', 'expense', '#06b6d4', 'zap'),
  ('Health', 'expense', '#22c55e', 'heart'),
  ('Education', 'expense', '#3b82f6', 'book-open'),
  ('Other', 'expense', '#6b7280', 'more-horizontal'),
  ('Salary', 'income', '#10b981', 'briefcase'),
  ('Freelance', 'income', '#8b5cf6', 'laptop'),
  ('Investments', 'income', '#f59e0b', 'trending-up'),
  ('Other Income', 'income', '#6b7280', 'plus-circle')
ON CONFLICT (name, type) DO NOTHING;

-- ============================================
-- 2. USER CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT NOT NULL DEFAULT 'tag',
  source_category_id UUID REFERENCES public.system_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, name, type)
);

CREATE INDEX IF NOT EXISTS idx_user_categories_user_id ON public.user_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_categories_type ON public.user_categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_user_categories_active ON public.user_categories(user_id) WHERE deleted_at IS NULL;

ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user_categories"
  ON public.user_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_categories"
  ON public.user_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_categories"
  ON public.user_categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own user_categories"
  ON public.user_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER set_user_categories_updated_at
  BEFORE UPDATE ON public.user_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 3. USER HIDDEN CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_hidden_categories (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.system_categories(id) ON DELETE CASCADE,
  hidden_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category_id)
);

ALTER TABLE public.user_hidden_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hidden categories"
  ON public.user_hidden_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hidden categories"
  ON public.user_hidden_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hidden categories"
  ON public.user_hidden_categories FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. UPDATE TRANSACTIONS TABLE
-- ============================================
-- Add reference to system category for backward compatibility
-- Transactions can reference either old categories, system_categories, or user_categories
-- We'll use a new nullable column for clarity
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS system_category_id UUID REFERENCES public.system_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_category_id UUID REFERENCES public.user_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_system_category ON public.transactions(system_category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_category_id);

-- ============================================
-- 5. MIGRATE EXISTING DATA
-- ============================================
-- Map existing per-user categories to the new system:
-- For each existing category that matches a system category name+type,
-- point transactions to the system category.
-- For custom ones, move them to user_categories.

-- Step A: Insert user-created categories that DON'T match system defaults into user_categories
INSERT INTO public.user_categories (id, user_id, name, type, color, icon, created_at, updated_at)
SELECT c.id, c.user_id, c.name, c.type, c.color, c.icon, c.created_at, c.updated_at
FROM public.categories c
WHERE NOT EXISTS (
  SELECT 1 FROM public.system_categories sc
  WHERE sc.name = c.name AND sc.type = c.type
)
ON CONFLICT (user_id, name, type) DO NOTHING;

-- Step B: For transactions referencing old categories that match system defaults,
-- set system_category_id
UPDATE public.transactions t
SET system_category_id = sc.id
FROM public.categories c
JOIN public.system_categories sc ON sc.name = c.name AND sc.type = c.type
WHERE t.category_id = c.id;

-- Step C: For transactions referencing old categories that are custom,
-- set user_category_id
UPDATE public.transactions t
SET user_category_id = uc.id
FROM public.categories c
JOIN public.user_categories uc ON uc.id = c.id
WHERE t.category_id = c.id
  AND t.system_category_id IS NULL;

-- ============================================
-- 6. UPDATE DEFAULT CATEGORIES TRIGGER
-- ============================================
-- Remove the old trigger that creates per-user default categories
-- System categories are now global and don't need per-user copies
DROP TRIGGER IF EXISTS on_user_created_add_categories ON auth.users;
DROP FUNCTION IF EXISTS public.create_default_categories();

-- ============================================
-- 7. VIEW FOR MERGED CATEGORIES
-- ============================================
-- This view merges system + user categories for easy querying
CREATE OR REPLACE VIEW public.merged_categories AS
SELECT
  sc.id,
  sc.name,
  sc.type,
  sc.color,
  sc.icon,
  sc.created_at,
  sc.updated_at,
  'system' AS source,
  NULL::UUID AS user_id,
  NULL::UUID AS source_category_id,
  NULL::TIMESTAMPTZ AS deleted_at
FROM public.system_categories sc
UNION ALL
SELECT
  uc.id,
  uc.name,
  uc.type,
  uc.color,
  uc.icon,
  uc.created_at,
  uc.updated_at,
  'user' AS source,
  uc.user_id,
  uc.source_category_id,
  uc.deleted_at
FROM public.user_categories uc;

