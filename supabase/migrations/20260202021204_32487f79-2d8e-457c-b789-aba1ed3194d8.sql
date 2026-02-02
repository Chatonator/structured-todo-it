-- Add time_block column to time_events for block-based scheduling
ALTER TABLE public.time_events 
ADD COLUMN IF NOT EXISTS time_block TEXT DEFAULT NULL;

-- Create day_planning_config table for daily quotas
CREATE TABLE IF NOT EXISTS public.day_planning_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  quota_minutes INTEGER NOT NULL DEFAULT 240,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on day_planning_config
ALTER TABLE public.day_planning_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for day_planning_config
CREATE POLICY "Users can view their own planning config"
ON public.day_planning_config
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planning config"
ON public.day_planning_config
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planning config"
ON public.day_planning_config
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planning config"
ON public.day_planning_config
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_day_planning_config_updated_at
BEFORE UPDATE ON public.day_planning_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();