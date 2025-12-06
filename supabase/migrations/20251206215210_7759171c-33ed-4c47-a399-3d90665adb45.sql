-- Allow team members to view profiles of other team members
CREATE POLICY "Team members can view profiles of team members"
ON public.profiles
FOR SELECT
USING (
  -- User can always see their own profile
  auth.uid() = user_id
  OR
  -- User can see profiles of people in the same team
  EXISTS (
    SELECT 1 FROM team_members tm1
    JOIN team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid()
    AND tm2.user_id = profiles.user_id
  )
);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;