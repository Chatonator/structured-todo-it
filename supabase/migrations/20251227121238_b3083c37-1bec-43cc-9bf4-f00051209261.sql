-- Ajouter is_pinned à la table items
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

-- Créer un index pour les items épinglés
CREATE INDEX IF NOT EXISTS items_is_pinned_idx ON public.items(is_pinned) WHERE is_pinned = true;

-- Migrer les données de pinned_tasks vers items.is_pinned
UPDATE public.items i
SET is_pinned = true
WHERE i.id IN (
  SELECT task_id FROM public.pinned_tasks
);