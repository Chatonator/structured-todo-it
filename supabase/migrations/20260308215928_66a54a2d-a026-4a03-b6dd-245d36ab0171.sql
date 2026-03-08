ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS invite_link_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS code_join_role text NOT NULL DEFAULT 'guest';