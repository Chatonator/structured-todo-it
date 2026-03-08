
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF auth.uid() != 'a72dc5ca-c281-46c0-a16c-139676705564'::uuid THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM profiles),
    'users_last_7d', (SELECT count(*) FROM profiles WHERE created_at > now() - interval '7 days'),
    'total_bugs', (SELECT count(*) FROM bug_reports WHERE type = 'bug'),
    'open_bugs', (SELECT count(*) FROM bug_reports WHERE type = 'bug' AND status IN ('open', 'in_progress')),
    'total_suggestions', (SELECT count(*) FROM bug_reports WHERE type = 'feature_request'),
    'open_suggestions', (SELECT count(*) FROM bug_reports WHERE type = 'feature_request' AND status IN ('open', 'in_progress')),
    'total_teams', (SELECT count(*) FROM teams),
    'total_updates', (SELECT count(*) FROM app_updates)
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_users_list(_limit int DEFAULT 50, _offset int DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF auth.uid() != 'a72dc5ca-c281-46c0-a16c-139676705564'::uuid THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT jsonb_agg(row_to_json(u)) INTO result
  FROM (
    SELECT 
      p.user_id,
      p.display_name,
      p.email,
      p.created_at,
      (SELECT count(*) FROM items i WHERE i.user_id = p.user_id) as task_count,
      (SELECT count(*) FROM items i WHERE i.user_id = p.user_id AND i.is_completed = true) as completed_count,
      (SELECT count(*) FROM habits h WHERE h.user_id = p.user_id) as habit_count,
      (SELECT count(*) FROM bug_reports br WHERE br.user_id = p.user_id) as report_count
    FROM profiles p
    ORDER BY p.created_at DESC
    LIMIT _limit OFFSET _offset
  ) u;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.send_admin_notification(
  _target_user_id uuid,
  _title text,
  _message text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() != 'a72dc5ca-c281-46c0-a16c-139676705564'::uuid THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (_target_user_id, 'info', _title, _message, _metadata);
END;
$$;
