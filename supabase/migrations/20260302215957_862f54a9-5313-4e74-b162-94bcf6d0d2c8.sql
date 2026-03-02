
-- Supprimer les anciennes politiques admin avec le mauvais UUID
DROP POLICY IF EXISTS "Admin can view all bug reports" ON public.bug_reports;
DROP POLICY IF EXISTS "Admin can update all bug reports" ON public.bug_reports;

-- Recréer avec le bon UUID
CREATE POLICY "Admin can view all bug reports"
ON public.bug_reports
FOR SELECT
USING (auth.uid() = 'a72dc5ca-c281-46c0-a16c-139676705564'::uuid);

CREATE POLICY "Admin can update all bug reports"
ON public.bug_reports
FOR UPDATE
USING (auth.uid() = 'a72dc5ca-c281-46c0-a16c-139676705564'::uuid)
WITH CHECK (auth.uid() = 'a72dc5ca-c281-46c0-a16c-139676705564'::uuid);
