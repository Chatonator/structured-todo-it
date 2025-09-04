-- Vérification et application des policies RLS pour la suppression
-- RLS activée pour la table tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Créer la policy DELETE si elle n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can delete their own tasks' 
        AND polrelid = 'public.tasks'::regclass
    ) THEN
        CREATE POLICY "Users can delete their own tasks"
        ON public.tasks
        FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END $$;