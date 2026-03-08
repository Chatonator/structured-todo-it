
CREATE OR REPLACE FUNCTION public.send_team_notification(
  _team_id uuid,
  _sender_id uuid,
  _type text,
  _title text,
  _message text,
  _metadata jsonb DEFAULT '{}'::jsonb,
  _target_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _member RECORD;
BEGIN
  -- Verify sender is a team member
  IF NOT is_team_member(_sender_id, _team_id) THEN
    RAISE EXCEPTION 'User is not a member of this team';
  END IF;

  IF _target_user_id IS NOT NULL THEN
    -- Send to specific user (must also be team member)
    IF NOT is_team_member(_target_user_id, _team_id) THEN
      RAISE EXCEPTION 'Target user is not a member of this team';
    END IF;
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (_target_user_id, _type, _title, _message, _metadata);
  ELSE
    -- Send to all team members except sender
    FOR _member IN
      SELECT user_id FROM public.team_members WHERE team_id = _team_id AND user_id != _sender_id
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (_member.user_id, _type, _title, _message, _metadata);
    END LOOP;
  END IF;
END;
$$;
