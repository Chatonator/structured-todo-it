-- SECURITY FIX: Remove dangerous INSERT policy on team_members
-- This policy allowed any authenticated user to insert themselves as owner in any team
-- All legitimate inserts go through Edge Functions using service_role (bypasses RLS)
DROP POLICY IF EXISTS "Users can add themselves when creating team" ON public.team_members;