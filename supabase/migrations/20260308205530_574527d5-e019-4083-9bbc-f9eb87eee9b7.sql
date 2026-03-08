
-- Table for activity feed
CREATE TABLE public.team_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL DEFAULT 'task',
  entity_id uuid,
  entity_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_team_activity_log_team_created ON public.team_activity_log(team_id, created_at DESC);

-- RLS
ALTER TABLE public.team_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view activity logs"
  ON public.team_activity_log FOR SELECT
  TO authenticated
  USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "System can insert activity logs"
  ON public.team_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_team_member(auth.uid(), team_id));

-- Trigger function to log team_tasks changes
CREATE OR REPLACE FUNCTION public.log_team_task_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    -- Task completed
    IF NEW.iscompleted = true AND OLD.iscompleted = false THEN
      _action := 'task_completed';
      _user_id := COALESCE(NEW.assigned_to, NEW.created_by);
      INSERT INTO public.team_activity_log (team_id, user_id, action, entity_type, entity_id, entity_name, metadata)
      VALUES (NEW.team_id, _user_id, _action, 'task', NEW.id, NEW.name, _metadata);
    END IF;

    -- Task assigned
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
      _action := 'task_assigned';
      _user_id := NEW.assigned_to;
      _metadata := jsonb_build_object('assigned_to', NEW.assigned_to);
      INSERT INTO public.team_activity_log (team_id, user_id, action, entity_type, entity_id, entity_name, metadata)
      VALUES (NEW.team_id, _user_id, _action, 'task', NEW.id, NEW.name, _metadata);
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Attach trigger
CREATE TRIGGER trg_team_task_activity
  AFTER INSERT OR UPDATE ON public.team_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_team_task_activity();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_activity_log;
