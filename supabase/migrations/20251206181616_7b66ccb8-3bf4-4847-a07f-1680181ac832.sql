-- Suppression des colonnes temporelles obsolètes de la table tasks
-- Ces données sont maintenant gérées exclusivement via la table time_events

ALTER TABLE public.tasks 
DROP COLUMN IF EXISTS "scheduledDate",
DROP COLUMN IF EXISTS "scheduledTime",
DROP COLUMN IF EXISTS "startTime",
DROP COLUMN IF EXISTS "isRecurring",
DROP COLUMN IF EXISTS "recurrenceInterval",
DROP COLUMN IF EXISTS "lastCompletedAt";