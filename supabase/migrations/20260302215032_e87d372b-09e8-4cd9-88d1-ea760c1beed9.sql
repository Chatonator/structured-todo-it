
-- Politique SELECT admin : voir tous les bug reports
CREATE POLICY "Admin can view all bug reports"
ON public.bug_reports
FOR SELECT
USING (auth.uid() = '5bc43bb8-0880-4631-bc01-174543461bb8'::uuid);

-- Politique UPDATE admin : modifier status et notes
CREATE POLICY "Admin can update all bug reports"
ON public.bug_reports
FOR UPDATE
USING (auth.uid() = '5bc43bb8-0880-4631-bc01-174543461bb8'::uuid)
WITH CHECK (auth.uid() = '5bc43bb8-0880-4631-bc01-174543461bb8'::uuid);
