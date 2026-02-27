
-- Add refinement columns to xp_transactions
ALTER TABLE public.xp_transactions 
  ADD COLUMN is_refined boolean NOT NULL DEFAULT false,
  ADD COLUMN refined_at timestamptz NULL;

-- Allow users to update their own transactions (needed for refinement)
CREATE POLICY "Users can update their own transactions"
  ON public.xp_transactions
  FOR UPDATE
  USING (auth.uid() = user_id);
