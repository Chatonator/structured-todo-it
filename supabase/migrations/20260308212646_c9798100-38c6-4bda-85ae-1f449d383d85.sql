
-- Table: team_labels
CREATE TABLE public.team_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view labels" ON public.team_labels
  FOR SELECT USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can create labels" ON public.team_labels
  FOR INSERT WITH CHECK (public.is_team_member(auth.uid(), team_id) AND auth.uid() = created_by);

CREATE POLICY "Team members can update labels" ON public.team_labels
  FOR UPDATE USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can delete labels" ON public.team_labels
  FOR DELETE USING (public.is_team_admin(auth.uid(), team_id));

-- Table: team_task_labels (junction)
CREATE TABLE public.team_task_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.team_tasks(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES public.team_labels(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, label_id)
);

ALTER TABLE public.team_task_labels ENABLE ROW LEVEL SECURITY;

-- Need a security definer function to check team membership via task
CREATE OR REPLACE FUNCTION public.is_label_team_member(_user_id uuid, _label_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_labels tl
    JOIN public.team_members tm ON tm.team_id = tl.team_id
    WHERE tl.id = _label_id AND tm.user_id = _user_id
  )
$$;

CREATE POLICY "Team members can view task labels" ON public.team_task_labels
  FOR SELECT USING (public.is_watcher_team_member(auth.uid(), task_id));

CREATE POLICY "Team members can add task labels" ON public.team_task_labels
  FOR INSERT WITH CHECK (public.is_watcher_team_member(auth.uid(), task_id) AND public.is_label_team_member(auth.uid(), label_id));

CREATE POLICY "Team members can remove task labels" ON public.team_task_labels
  FOR DELETE USING (public.is_watcher_team_member(auth.uid(), task_id));

-- Table: team_task_comments
CREATE TABLE public.team_task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.team_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view comments" ON public.team_task_comments
  FOR SELECT USING (public.is_watcher_team_member(auth.uid(), task_id));

CREATE POLICY "Team members can add comments" ON public.team_task_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_watcher_team_member(auth.uid(), task_id));

CREATE POLICY "Users can delete their own comments" ON public.team_task_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_team_task_comments_task_id ON public.team_task_comments(task_id, created_at);
CREATE INDEX idx_team_task_labels_task_id ON public.team_task_labels(task_id);
CREATE INDEX idx_team_labels_team_id ON public.team_labels(team_id);
