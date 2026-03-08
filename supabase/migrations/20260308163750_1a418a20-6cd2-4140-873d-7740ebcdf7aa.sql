
-- 1. Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Update handle_new_user trigger to store email and fallback display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    new.id,
    COALESCE(
      NULLIF(TRIM(new.raw_user_meta_data ->> 'display_name'), ''),
      SPLIT_PART(new.email, '@', 1)
    ),
    new.email
  );
  RETURN new;
END;
$$;

-- 3. Backfill existing profiles with missing display_name or email
UPDATE public.profiles p
SET 
  email = COALESCE(p.email, u.email),
  display_name = COALESCE(
    NULLIF(TRIM(p.display_name), ''),
    SPLIT_PART(u.email, '@', 1)
  )
FROM auth.users u
WHERE p.user_id = u.id
  AND (p.display_name IS NULL OR TRIM(p.display_name) = '' OR p.email IS NULL);

-- 4. Create team_invitations table
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  invited_email text NOT NULL,
  invited_user_id uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

-- 5. Enable RLS on team_invitations
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for team_invitations
-- Admins/owners of the team can view invitations they sent
CREATE POLICY "Team admins can view team invitations"
  ON public.team_invitations FOR SELECT
  TO authenticated
  USING (is_team_admin(auth.uid(), team_id));

-- Invited users can view their own invitations
CREATE POLICY "Users can view their own invitations"
  ON public.team_invitations FOR SELECT
  TO authenticated
  USING (invited_user_id = auth.uid());

-- Allow service role inserts (edge function uses service role)
-- For direct inserts, team admins can insert
CREATE POLICY "Team admins can create invitations"
  ON public.team_invitations FOR INSERT
  TO authenticated
  WITH CHECK (is_team_admin(auth.uid(), team_id));

-- Invited users can update their own invitations (accept/decline)
CREATE POLICY "Users can respond to their invitations"
  ON public.team_invitations FOR UPDATE
  TO authenticated
  USING (invited_user_id = auth.uid());

-- Allow notifications insert by service role for cross-user notifications
-- We need to update the notifications INSERT policy to allow service role
-- The edge function uses service_role_key which bypasses RLS, so no change needed

-- 7. Index for fast lookups
CREATE INDEX idx_team_invitations_invited_user ON public.team_invitations(invited_user_id, status);
CREATE INDEX idx_team_invitations_team ON public.team_invitations(team_id, status);
CREATE INDEX idx_profiles_email ON public.profiles(email);
