
-- Create bug_reports table
CREATE TABLE public.bug_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  screenshot_url text,
  page_url text,
  user_agent text,
  status text NOT NULL DEFAULT 'open',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own bug reports
CREATE POLICY "Users can insert their own bug reports"
ON public.bug_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own bug reports
CREATE POLICY "Users can view their own bug reports"
ON public.bug_reports FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create storage bucket for bug screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-screenshots', 'bug-screenshots', true);

-- Anyone can view bug screenshots (public bucket)
CREATE POLICY "Public read access for bug screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'bug-screenshots');

-- Authenticated users can upload screenshots
CREATE POLICY "Authenticated users can upload bug screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bug-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
