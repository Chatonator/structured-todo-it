-- Add show_in_sidebar column to team_projects for parity with personal projects
ALTER TABLE public.team_projects 
ADD COLUMN IF NOT EXISTS show_in_sidebar BOOLEAN DEFAULT false;