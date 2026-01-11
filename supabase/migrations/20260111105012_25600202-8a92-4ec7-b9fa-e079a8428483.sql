-- Fix gamification_data_exposure: Restrict achievements and challenges to authenticated users only

-- Drop existing public policies
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.achievements;
DROP POLICY IF EXISTS "Challenges are viewable by everyone" ON public.challenges;

-- Create authenticated-only policies
CREATE POLICY "Authenticated users can view achievements"
  ON public.achievements FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view challenges"
  ON public.challenges FOR SELECT
  USING (auth.uid() IS NOT NULL);