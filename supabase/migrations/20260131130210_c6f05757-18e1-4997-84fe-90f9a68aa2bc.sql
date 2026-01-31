-- Ajouter kanban_columns aux projets d'équipe pour colonnes personnalisées
ALTER TABLE public.team_projects 
ADD COLUMN IF NOT EXISTS kanban_columns JSONB DEFAULT NULL;

-- Ajouter project_status aux tâches d'équipe pour supporter 3+ colonnes Kanban
ALTER TABLE public.team_tasks 
ADD COLUMN IF NOT EXISTS project_status TEXT DEFAULT 'todo';

-- Index pour améliorer les performances des requêtes par statut
CREATE INDEX IF NOT EXISTS idx_team_tasks_project_status ON public.team_tasks(project_status);

-- Commentaires pour documentation
COMMENT ON COLUMN public.team_projects.kanban_columns IS 'Colonnes Kanban personnalisées au format JSON [{id, name, color, order}]';
COMMENT ON COLUMN public.team_tasks.project_status IS 'Statut Kanban de la tâche (todo, in-progress, done, ou ID de colonne personnalisée)';