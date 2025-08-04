-- Add recurrence fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN isRecurring boolean DEFAULT false,
ADD COLUMN recurrenceInterval text,
ADD COLUMN lastCompletedAt timestamp with time zone;

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;