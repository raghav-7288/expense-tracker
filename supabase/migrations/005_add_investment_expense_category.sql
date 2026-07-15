-- ============================================
-- ADD INVESTMENTS EXPENSE SYSTEM CATEGORY
-- ============================================
-- Adds "Investments" as an expense category to track money
-- being deployed into investments (SIPs, stocks, mutual funds, etc.)
-- The existing "Investments" income category remains for tracking returns.

INSERT INTO public.system_categories (name, type, color, icon) VALUES
  ('Investments', 'expense', '#f59e0b', 'trending-up')
ON CONFLICT (name, type) DO NOTHING;

