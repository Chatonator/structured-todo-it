CREATE TABLE public.time_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'habit', 'challenge', 'reminder', 'external')),
  entity_id UUID NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  duration INTEGER NOT NULL DEFAULT 30,
  is_all_day BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'Europe/Paris',
  recurrence JSONB,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT,
  priority INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled', 'missed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (entity_type, entity_id)
);

ALTER TABLE public.time_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_time_events_user_dates ON public.time_events (user_id, starts_at, ends_at);
CREATE INDEX idx_time_events_entity ON public.time_events (entity_type, entity_id);
CREATE INDEX idx_time_events_status ON public.time_events (user_id, status);

CREATE TABLE public.time_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.time_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'missed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, starts_at)
);

ALTER TABLE public.time_occurrences ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_occurrences_user_dates ON public.time_occurrences (user_id, starts_at, ends_at);
CREATE INDEX idx_occurrences_event ON public.time_occurrences (event_id);
CREATE INDEX idx_occurrences_status ON public.time_occurrences (user_id, status);