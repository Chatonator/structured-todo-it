-- Activer les extensions nécessaires pour les cron jobs et tâches récurrentes
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Supprimer l'ancien cron job s'il existe et le recréer avec les bonnes extensions
SELECT cron.unschedule('process-recurring-tasks-daily');

-- Recréer le cron job maintenant que pg_net est disponible
SELECT cron.schedule(
  'process-recurring-tasks-daily', 
  '0 6 * * *', -- Tous les jours à 6h00
  $$
  SELECT net.http_post(
    url:='https://dqctsbahpxeosufvapln.supabase.co/functions/v1/process-recurring-tasks',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxY3RzYmFocHhlb3N1ZnZhcGxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzODk1MywiZXhwIjoyMDY5NjE0OTUzfQ.b39F9ktLXJ3RItBGRMGYfgGBYPjXJOjON1vWDoF-gWw"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);