-- Add blocking columns to team_tasks
ALTER TABLE public.team_tasks
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_reason text;

-- Create team_task_watchers table
CREATE TABLE IF NOT EXISTS public.team_task_watchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.team_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, user_id)
);

ALTER TABLE public.team_task_watchers ENABLE ROW LEVEL SECURITY;

-- RLS: need to join through team_tasks to get team_id
CREATE OR REPLACE FUNCTION public.is_watcher_team_member(_user_id uuid, _task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_tasks tt
    JOIN public.team_members tm ON tm.team_id = tt.team_id
    WHERE tt.id = _task_id AND tm.user_id = _user_id
  )
$$;

CREATE POLICY "Team members can view watchers"
  ON public.team_task_watchers FOR SELECT
  USING (is_watcher_team_member(auth.uid(), task_id));

CREATE POLICY "Team members can watch tasks"
  ON public.team_task_watchers FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_watcher_team_member(auth.uid(), task_id));

CREATE POLICY "Users can unwatch tasks"
  ON public.team_task_watchers FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger to log blocking
CREATE OR REPLACE FUNCTION public.log_team_task_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _action text;
  _user_id uuid;
  _metadata jsonb := '{}'::jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := 'task_created';
    _user_id := NEW.created_by;
    INSERT INTO public.team_activity_log (team_id, user_id, action, entity_type, entity_id, entity_name, metadata)
    VALUES (NEW.team_id, _user_id, _action, 'task', NEW.id, NEW.name, _metadata);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.iscompleted = true AND OLD.iscompleted = false THEN
      _action := 'task_completed';
      _user_id := COALESCE(NEW.assigned_to, NEW.created_by);
      INSERT INTO public.team_activity_log (team_id, user_id, action, entity_type, entity_id, entity_name, metadata)
      VALUES (NEW.team_id, _user_id, _action, 'task', NEW.id, NEW.name, _metadata);
    END IF;

    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
      _action := 'task_assigned';
      _user_id := NEW.assigned_to;
      _metadata := jsonb_build_object('assigned_to', NEW.assigned_to);
      INSERT INTO public.team_activity_log (team_id, user_id, action, entity_type, entity_id, entity_name, metadata)
      VALUES (NEW.team_id, _user_id, _action, 'task', NEW.id, NEW.name, _metadata);
    END IF;

    IF NEW.is_blocked = true AND OLD.is_blocked = false THEN
      _action := 'task_blocked';
      _user_id := COALESCE(NEW.assigned_to, NEW.created_by);
      _metadata := jsonb_build_object('reason', COALESCE(NEW.blocked_reason, ''));
      INSERT INTO public.team_activity_log (team_id, user_id, action, entity_type, entity_id, entity_name, metadata)
      VALUES (NEW.team_id, _user_id, _action, 'task', NEW.id, NEW.name, _metadata);
    END IF;

    IF NEW.is_blocked = false AND OLD.is_blocked = true THEN
      _action := 'task_unblocked';
      _user_id := COALESCE(NEW.assigned_to, NEW.created_by);
      INSERT INTO public.team_activity_log (team_id, user_id, action, entity_type, entity_id, entity_name, metadata)
      VALUES (NEW.team_id, _user_id, _action, 'task', NEW.id, NEW.name, _metadata);
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$function$;