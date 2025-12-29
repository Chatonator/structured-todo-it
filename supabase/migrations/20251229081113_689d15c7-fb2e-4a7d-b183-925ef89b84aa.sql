-- =============================================
-- Migration: Suppression des anciennes tables
-- Toutes les données sont maintenant dans la table 'items'
-- et les événements temporels dans 'time_events' / 'time_occurrences'
-- =============================================

-- Supprimer la table tasks (remplacée par items avec item_type='task')
DROP TABLE IF EXISTS public.tasks CASCADE;

-- Supprimer la table projects (remplacée par items avec item_type='project')
DROP TABLE IF EXISTS public.projects CASCADE;

-- Supprimer la table habits (remplacée par items avec item_type='habit')
DROP TABLE IF EXISTS public.habits CASCADE;

-- Supprimer la table decks (remplacée par items avec item_type='deck')
DROP TABLE IF EXISTS public.decks CASCADE;

-- Supprimer la table habit_completions (remplacée par time_occurrences)
DROP TABLE IF EXISTS public.habit_completions CASCADE;

-- Supprimer la table pinned_tasks (is_pinned est maintenant dans items)
DROP TABLE IF EXISTS public.pinned_tasks CASCADE;

-- Supprimer les fonctions associées aux anciennes tables
DROP FUNCTION IF EXISTS public.calculate_project_progress(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_project_progress_trigger() CASCADE;