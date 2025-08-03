-- Add recurrence fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN isRecurring boolean DEFAULT false,
ADD COLUMN recurrenceInterval text,
ADD COLUMN lastCompletedAt timestamp with time zone;

-- Create index for efficient querying of recurring tasks
CREATE INDEX idx_tasks_recurring ON public.tasks (isRecurring, isCompleted, lastCompletedAt) 
WHERE isRecurring = true;

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;