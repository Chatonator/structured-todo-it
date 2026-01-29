-- Create team_projects table
CREATE TABLE public.team_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#a78bfa',
  status TEXT NOT NULL DEFAULT 'planning',
  target_date DATE,
  order_index INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.team_projects ENABLE ROW LEVEL SECURITY;

-- Policies: only team members can access team projects
CREATE POLICY "Team members can view team projects"
ON public.team_projects FOR SELECT
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can create team projects"
ON public.team_projects FOR INSERT
WITH CHECK (is_team_member(auth.uid(), team_id) AND auth.uid() = created_by);

CREATE POLICY "Team members can update team projects"
ON public.team_projects FOR UPDATE
USING (is_team_member(auth.uid(), team_id))
WITH CHECK (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can delete team projects"
ON public.team_projects FOR DELETE
USING (is_team_admin(auth.uid(), team_id));

-- Add trigger for updated_at
CREATE TRIGGER update_team_projects_updated_at
BEFORE UPDATE ON public.team_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add project_id column to team_tasks for linking tasks to projects
ALTER TABLE public.team_tasks 
ADD COLUMN project_id UUID REFERENCES public.team_projects(id) ON DELETE SET NULL;