-- Create table for pinned tasks
CREATE TABLE public.pinned_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, task_id)
);

-- Enable Row Level Security
ALTER TABLE public.pinned_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own pinned tasks" 
ON public.pinned_tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pinned tasks" 
ON public.pinned_tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pinned tasks" 
ON public.pinned_tasks 
FOR DELETE 
USING (auth.uid() = user_id);