
ALTER TABLE public.bug_reports
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'bug',
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'medium';
