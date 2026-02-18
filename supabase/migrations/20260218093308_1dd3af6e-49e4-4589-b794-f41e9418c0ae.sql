
-- 1. Remove duplicate task transactions, keeping the earliest one
DELETE FROM public.xp_transactions a
USING public.xp_transactions b
WHERE a.source_type = 'task' 
  AND a.source_id IS NOT NULL
  AND a.user_id = b.user_id
  AND a.source_type = b.source_type
  AND a.source_id = b.source_id
  AND a.created_at > b.created_at;

-- 2. Now create the unique partial index
CREATE UNIQUE INDEX idx_xp_transactions_unique_task 
ON public.xp_transactions(user_id, source_type, source_id) 
WHERE source_type = 'task' AND source_id IS NOT NULL;

-- 3. Add last_streak_qualified_date for reliable streak tracking
ALTER TABLE public.user_progress 
ADD COLUMN last_streak_qualified_date date DEFAULT NULL;
