-- Create decks table for organizing habits
CREATE TABLE public.decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#ec4899',
  icon TEXT DEFAULT '🎯',
  is_default BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create habits table
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deck_id UUID REFERENCES public.decks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '✨',
  color TEXT DEFAULT '#ec4899',
  frequency TEXT DEFAULT 'daily', -- daily, weekly, monthly
  target_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,0], -- 0=Sunday, 1=Monday, etc.
  reminder_time TIME,
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create habit_completions table for tracking
CREATE TABLE public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate completions per day
CREATE UNIQUE INDEX habit_completions_unique_per_day ON public.habit_completions(habit_id, date);

-- Create indexes for performance
CREATE INDEX idx_decks_user_id ON public.decks(user_id);
CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_habits_deck_id ON public.habits(deck_id);
CREATE INDEX idx_habit_completions_user_id ON public.habit_completions(user_id);
CREATE INDEX idx_habit_completions_habit_id ON public.habit_completions(habit_id);
CREATE INDEX idx_habit_completions_date ON public.habit_completions(date);

-- Enable Row Level Security
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for decks
CREATE POLICY "Users can view their own decks"
ON public.decks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decks"
ON public.decks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
ON public.decks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
ON public.decks
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for habits
CREATE POLICY "Users can view their own habits"
ON public.habits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habits"
ON public.habits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
ON public.habits
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
ON public.habits
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for habit_completions
CREATE POLICY "Users can view their own completions"
ON public.habit_completions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own completions"
ON public.habit_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completions"
ON public.habit_completions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completions"
ON public.habit_completions
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updating timestamps
CREATE TRIGGER update_decks_updated_at
BEFORE UPDATE ON public.decks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_habits_updated_at
BEFORE UPDATE ON public.habits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();