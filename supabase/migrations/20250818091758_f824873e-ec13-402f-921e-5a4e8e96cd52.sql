-- Nettoyer les colonnes de récurrence dupliquées et configurer le cron job
-- Étape 1: Migrer les données des anciennes colonnes vers les nouvelles si nécessaire
UPDATE tasks 
SET "isRecurring" = COALESCE("isRecurring", "isrecurring", false),
    "recurrenceInterval" = COALESCE("recurrenceInterval", "recurrenceinterval")
WHERE "isrecurring" IS NOT NULL OR "recurrenceinterval" IS NOT NULL;

-- Étape 2: Supprimer les anciennes colonnes en minuscules
ALTER TABLE tasks DROP COLUMN IF EXISTS "isrecurring";
ALTER TABLE tasks DROP COLUMN IF EXISTS "recurrenceinterval";

-- Étape 3: Nettoyer les doublons dans lastCompletedAt (garder la colonne correcte)
UPDATE tasks 
SET "lastCompletedAt" = COALESCE("lastCompletedAt", "lastcompletedat")
WHERE "lastcompletedat" IS NOT NULL;

ALTER TABLE tasks DROP COLUMN IF EXISTS "lastcompletedat";

-- Étape 4: Configurer le cron job pour exécuter le traitement des tâches récurrentes quotidiennement à 6h00
SELECT cron.schedule(
  'process-recurring-tasks-daily',
  '0 6 * * *', -- Tous les jours à 6h00
  $$
  SELECT net.http_post(
    url:='https://dqctsbahpxeosufvapln.supabase.co/functions/v1/process-recurring-tasks',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxY3RzYmFocHhlb3N1ZnZhcGxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzODk1MywiZXhwIjoyMDY5NjE0OTUzfQ.b39F9ktLXJ3RItBGRMGYfgGBYPjXJOjON1vWDoF-gWw"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Étape 5: Créer un index pour optimiser les requêtes de tâches récurrentes
CREATE INDEX IF NOT EXISTS idx_tasks_recurring_completed 
ON tasks ("isRecurring", "isCompleted", "lastCompletedAt") 
WHERE "isRecurring" = true;