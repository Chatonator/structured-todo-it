-- Add category, context, and estimatedTime columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Autres',
ADD COLUMN IF NOT EXISTS context text NOT NULL DEFAULT 'Perso',
ADD COLUMN IF NOT EXISTS "estimatedTime" integer NOT NULL DEFAULT 60;

-- Add category, context, and estimatedTime columns to habits table
ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Quotidien',
ADD COLUMN IF NOT EXISTS context text NOT NULL DEFAULT 'Perso',
ADD COLUMN IF NOT EXISTS "estimatedTime" integer NOT NULL DEFAULT 15;

-- Add category, context, and estimatedTime columns to decks table
ALTER TABLE public.decks 
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Quotidien',
ADD COLUMN IF NOT EXISTS context text NOT NULL DEFAULT 'Perso',
ADD COLUMN IF NOT EXISTS "estimatedTime" integer NOT NULL DEFAULT 30;