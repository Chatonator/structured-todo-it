-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- XP and Levels
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  xp_for_next_level INTEGER DEFAULT 100,
  
  -- Points
  lifetime_points INTEGER DEFAULT 0,
  current_points INTEGER DEFAULT 0,
  
  -- Statistics
  tasks_completed INTEGER DEFAULT 0,
  habits_completed INTEGER DEFAULT 0,
  current_task_streak INTEGER DEFAULT 0,
  longest_task_streak INTEGER DEFAULT 0,
  current_habit_streak INTEGER DEFAULT 0,
  longest_habit_streak INTEGER DEFAULT 0,
  
  -- Challenges
  daily_challenge_streak INTEGER DEFAULT 0,
  weekly_challenges_completed INTEGER DEFAULT 0,
  
  -- Timestamps
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_level ON public.user_progress(current_level DESC);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  category TEXT NOT NULL,
  
  target_value INTEGER,
  xp_reward INTEGER DEFAULT 0,
  points_reward INTEGER DEFAULT 0,
  
  is_secret BOOLEAN DEFAULT false,
  tier TEXT DEFAULT 'bronze',
  
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_achievements_category ON public.achievements(category);
CREATE INDEX idx_achievements_order ON public.achievements(display_order);

-- Enable RLS (achievements are public)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are viewable by everyone"
  ON public.achievements FOR SELECT
  USING (true);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  
  current_progress INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON public.user_achievements(user_id, is_unlocked);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON public.user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  
  target_type TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  
  xp_reward INTEGER DEFAULT 0,
  points_reward INTEGER DEFAULT 0,
  
  required_level INTEGER DEFAULT 1,
  weight INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_challenges_type ON public.challenges(type);
CREATE INDEX idx_challenges_category ON public.challenges(category);

-- Enable RLS (challenges are public)
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges are viewable by everyone"
  ON public.challenges FOR SELECT
  USING (true);

-- Create user_challenges table
CREATE TABLE public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  
  current_progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  assigned_date DATE NOT NULL,
  expires_at DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, challenge_id, assigned_date)
);

CREATE INDEX idx_user_challenges_user ON public.user_challenges(user_id);
CREATE INDEX idx_user_challenges_active ON public.user_challenges(user_id, is_completed, expires_at);

-- Enable RLS
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own challenges"
  ON public.user_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges"
  ON public.user_challenges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges"
  ON public.user_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create xp_transactions table
CREATE TABLE public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  source_type TEXT NOT NULL,
  source_id UUID,
  
  xp_gained INTEGER DEFAULT 0,
  points_gained INTEGER DEFAULT 0,
  
  description TEXT,
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_xp_transactions_user ON public.xp_transactions(user_id, created_at DESC);
CREATE INDEX idx_xp_transactions_source ON public.xp_transactions(source_type, source_id);

-- Enable RLS
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.xp_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.xp_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed achievements
INSERT INTO public.achievements (key, name, description, icon, category, target_value, xp_reward, points_reward, tier, display_order) VALUES
('first_task', 'Première tâche', 'Complétez votre première tâche', '✅', 'tasks', 1, 10, 2, 'bronze', 1),
('tasks_10', 'Débutant', 'Complétez 10 tâches', '📝', 'tasks', 10, 50, 10, 'bronze', 2),
('tasks_50', 'Organisé', 'Complétez 50 tâches', '📋', 'tasks', 50, 150, 30, 'silver', 3),
('tasks_100', 'Productif', 'Complétez 100 tâches', '🎯', 'tasks', 100, 300, 60, 'gold', 4),
('tasks_500', 'Maître du temps', 'Complétez 500 tâches', '⏱️', 'tasks', 500, 1000, 200, 'platinum', 5),

('first_habit', 'Première habitude', 'Complétez votre première habitude', '💪', 'habits', 1, 10, 2, 'bronze', 10),
('habits_30', 'Régulier', 'Complétez 30 habitudes', '📅', 'habits', 30, 100, 20, 'bronze', 11),
('habits_100', 'Discipliné', 'Complétez 100 habitudes', '🔥', 'habits', 100, 250, 50, 'silver', 12),

('streak_7', 'Semaine parfaite', 'Maintenez une série de 7 jours', '🔥', 'streaks', 7, 75, 15, 'bronze', 20),
('streak_30', 'Mois parfait', 'Maintenez une série de 30 jours', '🌟', 'streaks', 30, 300, 60, 'silver', 21),
('streak_100', 'Cent jours !', 'Maintenez une série de 100 jours', '💯', 'streaks', 100, 1000, 200, 'gold', 22),
('streak_365', 'Un an de discipline', 'Maintenez une série de 365 jours', '👑', 'streaks', 365, 5000, 1000, 'platinum', 23),

('level_5', 'Niveau 5', 'Atteignez le niveau 5', '⭐', 'milestones', 5, 100, 20, 'bronze', 30),
('level_10', 'Niveau 10', 'Atteignez le niveau 10', '🌟', 'milestones', 10, 250, 50, 'silver', 31),
('level_25', 'Niveau 25', 'Atteignez le niveau 25', '✨', 'milestones', 25, 500, 100, 'gold', 32),
('level_50', 'Niveau 50', 'Atteignez le niveau 50', '💫', 'milestones', 50, 1500, 300, 'platinum', 33),

('challenge_10', '10 défis', 'Complétez 10 défis', '🎯', 'challenges', 10, 100, 20, 'bronze', 40),
('challenge_50', '50 défis', 'Complétez 50 défis', '🏆', 'challenges', 50, 400, 80, 'silver', 41);

-- Seed daily challenges
INSERT INTO public.challenges (type, category, name, description, icon, target_type, target_value, xp_reward, points_reward, required_level, weight) VALUES
('daily', 'tasks', 'Complétez 3 tâches', 'Complétez 3 tâches aujourd''hui', '✅', 'complete_count', 3, 30, 6, 1, 10),
('daily', 'tasks', 'Complétez 5 tâches', 'Complétez 5 tâches aujourd''hui', '📝', 'complete_count', 5, 50, 10, 3, 8),
('daily', 'habits', 'Toutes les habitudes', 'Complétez toutes vos habitudes du jour', '💯', 'complete_all', 1, 50, 10, 1, 5),
('daily', 'habits', '3 habitudes', 'Complétez 3 habitudes aujourd''hui', '💪', 'complete_count', 3, 30, 6, 1, 10),
('daily', 'mixed', 'Journée productive', 'Complétez 3 tâches ET 2 habitudes', '🚀', 'mixed', 5, 60, 12, 5, 3);

-- Seed weekly challenges
INSERT INTO public.challenges (type, category, name, description, icon, target_type, target_value, xp_reward, points_reward, required_level, weight) VALUES
('weekly', 'tasks', '20 tâches cette semaine', 'Complétez 20 tâches cette semaine', '📋', 'complete_count', 20, 150, 30, 1, 8),
('weekly', 'habits', 'Semaine d''habitudes', 'Complétez toutes vos habitudes 5 jours cette semaine', '🔥', 'complete_days', 5, 200, 40, 1, 5),
('weekly', 'streaks', 'Série de 7 jours', 'Maintenez une série de 7 jours cette semaine', '🌟', 'streak', 7, 100, 20, 3, 7);