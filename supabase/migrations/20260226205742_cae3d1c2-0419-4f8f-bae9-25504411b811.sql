
-- Bloc 1: Alter user_progress + 3 new tables

-- 1. Add columns to user_progress
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS points_available integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_points_earned integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_points_spent integer NOT NULL DEFAULT 0;

-- 2. Rewards table (user-defined rewards to claim)
CREATE TABLE public.rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '🎁',
  cost_points integer NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rewards"
  ON public.rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rewards"
  ON public.rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards"
  ON public.rewards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rewards"
  ON public.rewards FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Claim history table
CREATE TABLE public.claim_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  reward_name text NOT NULL,
  cost_points integer NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.claim_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own claims"
  ON public.claim_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claims"
  ON public.claim_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. User skills table
CREATE TABLE public.user_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  skill_key text NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_key)
);

ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own skills"
  ON public.user_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills"
  ON public.user_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
  ON public.user_skills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills"
  ON public.user_skills FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at on user_skills
CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON public.user_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
