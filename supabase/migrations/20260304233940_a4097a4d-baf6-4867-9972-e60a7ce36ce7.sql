
-- Table des mises à jour de l'application
CREATE TABLE public.app_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text,
  title text NOT NULL,
  message text,
  update_type text NOT NULL DEFAULT 'feature',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_updates ENABLE ROW LEVEL SECURITY;

-- Tous les users authentifiés peuvent lire
CREATE POLICY "Authenticated users can view app updates"
  ON public.app_updates FOR SELECT TO authenticated
  USING (true);

-- Seul l'admin peut insérer/modifier/supprimer
CREATE POLICY "Admin can insert app updates"
  ON public.app_updates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = 'a72dc5ca-c281-46c0-a16c-139676705564'::uuid);

CREATE POLICY "Admin can update app updates"
  ON public.app_updates FOR UPDATE TO authenticated
  USING (auth.uid() = 'a72dc5ca-c281-46c0-a16c-139676705564'::uuid);

CREATE POLICY "Admin can delete app updates"
  ON public.app_updates FOR DELETE TO authenticated
  USING (auth.uid() = 'a72dc5ca-c281-46c0-a16c-139676705564'::uuid);

-- Table pivot pour tracker les updates vues par chaque user
CREATE TABLE public.user_seen_updates (
  user_id uuid NOT NULL,
  update_id uuid NOT NULL REFERENCES public.app_updates(id) ON DELETE CASCADE,
  seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, update_id)
);

ALTER TABLE public.user_seen_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own seen updates"
  ON public.user_seen_updates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own seen updates"
  ON public.user_seen_updates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
