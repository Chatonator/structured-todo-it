
-- 1. Supprimer tout l'historique XP
DELETE FROM public.xp_transactions;

-- 2. Supprimer l'historique des récompenses réclamées
DELETE FROM public.claim_history;

-- 3. Supprimer les compétences
DELETE FROM public.user_skills;

-- 4. Réinitialiser les succès
UPDATE public.user_achievements
SET current_progress = 0, is_unlocked = false, unlocked_at = NULL;

-- 5. Réinitialiser les défis
UPDATE public.user_challenges
SET current_progress = 0, is_completed = false, completed_at = NULL;

-- 6. Réinitialiser la progression utilisateur
UPDATE public.user_progress
SET total_xp = 0, current_level = 1, xp_for_next_level = 100,
    lifetime_points = 0, current_points = 0,
    points_available = 0, total_points_earned = 0, total_points_spent = 0,
    tasks_completed = 0, habits_completed = 0,
    current_task_streak = 0, longest_task_streak = 0,
    current_habit_streak = 0, longest_habit_streak = 0,
    last_activity_date = NULL, last_streak_qualified_date = NULL,
    daily_challenge_streak = 0, weekly_challenges_completed = 0,
    updated_at = now();
