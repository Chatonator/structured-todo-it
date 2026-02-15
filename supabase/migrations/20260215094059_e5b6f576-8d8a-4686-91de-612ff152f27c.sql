
-- Phase 1: Ajouter les colonnes Eisenhower à la table items
ALTER TABLE public.items 
  ADD COLUMN is_important boolean NOT NULL DEFAULT false,
  ADD COLUMN is_urgent boolean NOT NULL DEFAULT false;

-- Migrer les données existantes selon le mapping catégorie → quadrant
UPDATE public.items SET is_important = true, is_urgent = true WHERE category = 'Obligation';
UPDATE public.items SET is_important = false, is_urgent = true WHERE category = 'Quotidien';
UPDATE public.items SET is_important = true, is_urgent = false WHERE category = 'Envie';
UPDATE public.items SET is_important = false, is_urgent = false WHERE category = 'Autres';

-- Index pour les requêtes fréquentes par quadrant
CREATE INDEX idx_items_eisenhower ON public.items (is_important, is_urgent);
