-- Create a cron job to process recurring tasks every hour
SELECT cron.schedule(
  'process-recurring-tasks',
  '0 * * * *', -- Run every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://dqctsbahpxeosufvapln.supabase.co/functions/v1/process-recurring-tasks',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxY3RzYmFocHhlb3N1ZnZhcGxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzODk1MywiZXhwIjoyMDY5NjE0OTUzfQ.iHgK5Xs3HKBgdPLZeOjkU9i9M-tYRGYhxP5F8K7OQOE"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);