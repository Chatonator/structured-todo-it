-- Nettoyer les politiques RLS dupliquées sur la table tasks
-- Supprimer les anciennes politiques avec des noms génériques

DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.tasks;
DROP POLICY IF EXISTS "SELECT" ON public.tasks;
DROP POLICY IF EXISTS "UPDATE" ON public.tasks;

-- Garder seulement les politiques bien nommées :
-- "Users can create their own tasks" (INSERT)
-- "Users can view their own tasks" (SELECT)  
-- "Users can update their own tasks" (UPDATE)
-- "Users can delete their own tasks" (DELETE)

-- Vérifier que la politique DELETE existe bien
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tasks' 
        AND policyname = 'Users can delete their own tasks'
    ) THEN
        CREATE POLICY "Users can delete their own tasks" 
        ON public.tasks 
        FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END $$;