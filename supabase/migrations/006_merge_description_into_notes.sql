-- ============================================
-- MERGE description INTO notes COLUMN
-- ============================================
-- The description and notes columns serve the same purpose.
-- This migration merges description data into notes, then drops description.

-- Step 1: Copy description into notes where notes is currently NULL
UPDATE public.transactions
SET notes = description
WHERE notes IS NULL OR notes = '';

-- Step 2: For rows where notes already has content, prepend description
UPDATE public.transactions
SET notes = description || ' — ' || notes
WHERE notes IS NOT NULL AND notes != '' AND notes != description;

-- Step 3: Make notes NOT NULL (it now serves as the primary label)
ALTER TABLE public.transactions ALTER COLUMN notes SET NOT NULL;

-- Step 4: Drop the description column
ALTER TABLE public.transactions DROP COLUMN description;

