-- Créer la table projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Informations de base
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT NOT NULL DEFAULT '#a78bfa',
  
  -- Statut et organisation
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in-progress', 'on-hold', 'completed', 'archived')),
  target_date DATE,
  order_index INTEGER NOT NULL DEFAULT 0,
  
  -- Progression (calculée automatiquement)
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_project_name_per_user UNIQUE(user_id, name)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_order ON public.projects(user_id, order_index);

-- RLS Policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Ajouter colonnes à la table tasks
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS project_status TEXT DEFAULT 'todo' CHECK (project_status IN ('todo', 'in-progress', 'done'));

-- Index pour lier tâches aux projets
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON public.tasks(project_id, project_status) 
  WHERE project_id IS NOT NULL;

-- Fonction de calcul automatique de progression
CREATE OR REPLACE FUNCTION public.calculate_project_progress(project_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  progress_percent INTEGER;
BEGIN
  -- Compter les tâches principales du projet (level = 0)
  SELECT COUNT(*) INTO total_tasks
  FROM public.tasks
  WHERE project_id = project_uuid AND level = 0;
  
  -- Si aucune tâche, progression = 0
  IF total_tasks = 0 THEN
    RETURN 0;
  END IF;
  
  -- Compter les tâches complétées
  SELECT COUNT(*) INTO completed_tasks
  FROM public.tasks
  WHERE project_id = project_uuid 
    AND level = 0 
    AND "isCompleted" = true;
  
  -- Calculer pourcentage
  progress_percent := ROUND((completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100);
  
  RETURN progress_percent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour automatiquement la progression
CREATE OR REPLACE FUNCTION public.update_project_progress_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Si une tâche est liée à un projet
  IF NEW.project_id IS NOT NULL THEN
    UPDATE public.projects
    SET progress = public.calculate_project_progress(NEW.project_id),
        updated_at = now()
    WHERE id = NEW.project_id;
  END IF;
  
  -- Gérer aussi le cas de OLD pour les UPDATE/DELETE
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF OLD.project_id IS NOT NULL THEN
      UPDATE public.projects
      SET progress = public.calculate_project_progress(OLD.project_id),
          updated_at = now()
      WHERE id = OLD.project_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tasks_update_project_progress ON public.tasks;
CREATE TRIGGER tasks_update_project_progress
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_progress_trigger();

-- Achievements pour projets
INSERT INTO public.achievements (key, name, description, icon, category, target_value, xp_reward, points_reward, tier, display_order) 
VALUES
  ('first_project', 'Premier projet', 'Créez votre premier projet', '🎯', 'milestones', 1, 15, 3, 'bronze', 50),
  ('project_completed', 'Projet accompli', 'Complétez votre premier projet', '✅', 'milestones', 1, 100, 20, 'silver', 51),
  ('projects_5', 'Multi-projets', 'Complétez 5 projets', '🏆', 'milestones', 5, 300, 60, 'gold', 52),
  ('big_project', 'Grand projet', 'Complétez un projet avec plus de 10 tâches', '📚', 'milestones', 10, 150, 30, 'silver', 53)
ON CONFLICT (key) DO NOTHING;