-- Correction des fonctions sans search_path défini

-- 1. Recréer calculate_project_progress avec search_path
CREATE OR REPLACE FUNCTION public.calculate_project_progress(project_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  progress_percent INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_tasks
  FROM public.tasks
  WHERE project_id = project_uuid AND level = 0;
  
  IF total_tasks = 0 THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO completed_tasks
  FROM public.tasks
  WHERE project_id = project_uuid 
    AND level = 0 
    AND "isCompleted" = true;
  
  progress_percent := ROUND((completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100);
  
  RETURN progress_percent;
END;
$function$;

-- 2. Recréer update_project_progress_trigger avec search_path
CREATE OR REPLACE FUNCTION public.update_project_progress_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    UPDATE public.projects
    SET progress = public.calculate_project_progress(NEW.project_id),
        updated_at = now()
    WHERE id = NEW.project_id;
  END IF;
  
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
$function$;

-- 3. Recréer update_updated_at_column avec search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;