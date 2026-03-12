CREATE TABLE public.calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('outlook', 'google')),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('pending', 'connected', 'disconnected', 'error')),
  account_email TEXT,
  account_label TEXT,
  target_calendar_id TEXT,
  target_calendar_name TEXT,
  access_token_ciphertext TEXT,
  refresh_token_ciphertext TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  last_synced_at TIMESTAMPTZ,
  last_sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE TABLE public.calendar_event_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.calendar_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('outlook', 'google')),
  time_event_id UUID NOT NULL REFERENCES public.time_events(id) ON DELETE CASCADE,
  external_calendar_id TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  external_change_key TEXT,
  last_payload_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  last_synced_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (connection_id, time_event_id)
);

CREATE TABLE public.calendar_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('outlook', 'google')),
  time_event_id UUID REFERENCES public.time_events(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('upsert', 'delete')),
  event_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.calendar_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('outlook', 'google')),
  redirect_after TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_connections_user_provider ON public.calendar_connections (user_id, provider);
CREATE INDEX idx_calendar_links_connection_event ON public.calendar_event_links (connection_id, time_event_id);
CREATE INDEX idx_calendar_links_user_provider ON public.calendar_event_links (user_id, provider);
CREATE INDEX idx_calendar_jobs_user_provider_status_available ON public.calendar_sync_jobs (user_id, provider, status, available_at);
CREATE INDEX idx_calendar_jobs_event ON public.calendar_sync_jobs (time_event_id, provider, action);
CREATE INDEX idx_calendar_oauth_states_expires ON public.calendar_oauth_states (expires_at);

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_event_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own calendar sync jobs"
ON public.calendar_sync_jobs FOR SELECT
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_calendar_syncable_event(event_type TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT event_type IN ('task', 'habit', 'challenge');
$$;

CREATE OR REPLACE FUNCTION public.enqueue_calendar_sync_job()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  relevant_old BOOLEAN := FALSE;
  relevant_new BOOLEAN := FALSE;
  changed_for_calendar BOOLEAN := FALSE;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    relevant_old := public.is_calendar_syncable_event(OLD.entity_type);
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    relevant_new := public.is_calendar_syncable_event(NEW.entity_type);
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF relevant_new AND COALESCE(NEW.status, 'scheduled') <> 'cancelled' THEN
      INSERT INTO public.calendar_sync_jobs (user_id, provider, time_event_id, entity_type, entity_id, action, event_payload)
      SELECT NEW.user_id, connection.provider, NEW.id, NEW.entity_type, NEW.entity_id, 'upsert', to_jsonb(NEW)
      FROM public.calendar_connections connection
      WHERE connection.user_id = NEW.user_id
        AND connection.status IN ('connected', 'error')
        AND connection.provider IN ('outlook', 'google');
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF relevant_old THEN
      INSERT INTO public.calendar_sync_jobs (user_id, provider, time_event_id, entity_type, entity_id, action, event_payload)
      SELECT OLD.user_id, connection.provider, OLD.id, OLD.entity_type, OLD.entity_id, 'delete', to_jsonb(OLD)
      FROM public.calendar_connections connection
      WHERE connection.user_id = OLD.user_id
        AND connection.status IN ('connected', 'error')
        AND connection.provider IN ('outlook', 'google');
    END IF;
    RETURN OLD;
  END IF;

  IF relevant_old OR relevant_new THEN
    changed_for_calendar :=
      COALESCE(OLD.title, '') IS DISTINCT FROM COALESCE(NEW.title, '') OR
      COALESCE(OLD.description, '') IS DISTINCT FROM COALESCE(NEW.description, '') OR
      OLD.starts_at IS DISTINCT FROM NEW.starts_at OR
      OLD.ends_at IS DISTINCT FROM NEW.ends_at OR
      OLD.duration IS DISTINCT FROM NEW.duration OR
      COALESCE(OLD.is_all_day, FALSE) IS DISTINCT FROM COALESCE(NEW.is_all_day, FALSE) OR
      COALESCE(OLD.timezone, '') IS DISTINCT FROM COALESCE(NEW.timezone, '') OR
      COALESCE(OLD.recurrence, '{}'::JSONB) IS DISTINCT FROM COALESCE(NEW.recurrence, '{}'::JSONB) OR
      COALESCE(OLD.color, '') IS DISTINCT FROM COALESCE(NEW.color, '') OR
      COALESCE(OLD.time_block, '') IS DISTINCT FROM COALESCE(NEW.time_block, '') OR
      COALESCE(OLD.status, 'scheduled') IS DISTINCT FROM COALESCE(NEW.status, 'scheduled');

    IF relevant_old AND (NOT relevant_new OR COALESCE(NEW.status, 'scheduled') = 'cancelled') THEN
      INSERT INTO public.calendar_sync_jobs (user_id, provider, time_event_id, entity_type, entity_id, action, event_payload)
      SELECT OLD.user_id, connection.provider, OLD.id, OLD.entity_type, OLD.entity_id, 'delete', to_jsonb(OLD)
      FROM public.calendar_connections connection
      WHERE connection.user_id = OLD.user_id
        AND connection.status IN ('connected', 'error')
        AND connection.provider IN ('outlook', 'google');
      RETURN NEW;
    END IF;

    IF relevant_new AND changed_for_calendar THEN
      IF COALESCE(OLD.status, 'scheduled') = 'completed' AND COALESCE(NEW.status, 'scheduled') = 'completed' AND
         COALESCE(OLD.title, '') IS NOT DISTINCT FROM COALESCE(NEW.title, '') AND
         OLD.starts_at IS NOT DISTINCT FROM NEW.starts_at AND
         OLD.ends_at IS NOT DISTINCT FROM NEW.ends_at AND
         OLD.duration IS NOT DISTINCT FROM NEW.duration AND
         COALESCE(OLD.time_block, '') IS NOT DISTINCT FROM COALESCE(NEW.time_block, '') THEN
        RETURN NEW;
      END IF;

      IF COALESCE(OLD.status, 'scheduled') = 'scheduled' AND COALESCE(NEW.status, 'scheduled') = 'completed' AND
         COALESCE(OLD.title, '') IS NOT DISTINCT FROM COALESCE(NEW.title, '') AND
         OLD.starts_at IS NOT DISTINCT FROM NEW.starts_at AND
         OLD.ends_at IS NOT DISTINCT FROM NEW.ends_at AND
         OLD.duration IS NOT DISTINCT FROM NEW.duration AND
         COALESCE(OLD.description, '') IS NOT DISTINCT FROM COALESCE(NEW.description, '') AND
         COALESCE(OLD.recurrence, '{}'::JSONB) IS NOT DISTINCT FROM COALESCE(NEW.recurrence, '{}'::JSONB) AND
         COALESCE(OLD.color, '') IS NOT DISTINCT FROM COALESCE(NEW.color, '') AND
         COALESCE(OLD.time_block, '') IS NOT DISTINCT FROM COALESCE(NEW.time_block, '') THEN
        RETURN NEW;
      END IF;

      INSERT INTO public.calendar_sync_jobs (user_id, provider, time_event_id, entity_type, entity_id, action, event_payload)
      SELECT NEW.user_id, connection.provider, NEW.id, NEW.entity_type, NEW.entity_id, 'upsert', to_jsonb(NEW)
      FROM public.calendar_connections connection
      WHERE connection.user_id = NEW.user_id
        AND connection.status IN ('connected', 'error')
        AND connection.provider IN ('outlook', 'google');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calendar_sync_jobs_trigger ON public.time_events;
CREATE TRIGGER calendar_sync_jobs_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.time_events
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_calendar_sync_job();

DROP TRIGGER IF EXISTS update_calendar_connections_updated_at ON public.calendar_connections;
CREATE TRIGGER update_calendar_connections_updated_at
BEFORE UPDATE ON public.calendar_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_event_links_updated_at ON public.calendar_event_links;
CREATE TRIGGER update_calendar_event_links_updated_at
BEFORE UPDATE ON public.calendar_event_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_sync_jobs_updated_at ON public.calendar_sync_jobs;
CREATE TRIGGER update_calendar_sync_jobs_updated_at
BEFORE UPDATE ON public.calendar_sync_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
