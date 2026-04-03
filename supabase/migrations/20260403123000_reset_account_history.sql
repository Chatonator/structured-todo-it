DROP FUNCTION IF EXISTS public.reset_account_history();
DROP FUNCTION IF EXISTS public.reset_account_history(date);

CREATE OR REPLACE FUNCTION public.reset_account_history(p_user_today date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_reset_at timestamptz := now();
  v_today date := p_user_today;
  v_keep_item_ids uuid[] := '{}'::uuid[];
  v_delete_item_ids uuid[] := '{}'::uuid[];
  v_deleted_completed_items integer := 0;
  v_reopened_recurring_tasks integer := 0;
  v_cleared_occurrences integer := 0;
  v_cleared_notifications integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_today IS NULL THEN
    RAISE EXCEPTION 'p_user_today is required';
  END IF;

  SELECT COALESCE(array_agg(item_id), '{}'::uuid[])
  INTO v_keep_item_ids
  FROM (
    WITH RECURSIVE seed_items AS (
      SELECT i.id, i.parent_id
      FROM public.items i
      WHERE i.user_id = v_user_id
        AND (
          i.item_type IN ('habit', 'deck')
          OR (i.item_type IN ('task', 'subtask', 'project_task', 'project') AND i.is_completed = false)
          OR (
            i.item_type IN ('task', 'subtask', 'project_task')
            AND i.is_completed = true
            AND EXISTS (
              SELECT 1
              FROM public.time_events te
              WHERE te.user_id = v_user_id
                AND te.entity_type = 'task'
                AND te.entity_id = i.id
                AND te.recurrence IS NOT NULL
            )
          )
        )
    ),
    keep_tree AS (
      SELECT s.id, s.parent_id
      FROM seed_items s
      UNION
      SELECT parent.id, parent.parent_id
      FROM public.items parent
      JOIN keep_tree child ON child.parent_id = parent.id
      WHERE parent.user_id = v_user_id
    )
    SELECT DISTINCT id AS item_id
    FROM keep_tree
  ) kept;

  SELECT COALESCE(array_agg(i.id), '{}'::uuid[])
  INTO v_delete_item_ids
  FROM public.items i
  WHERE i.user_id = v_user_id
    AND NOT (i.id = ANY(v_keep_item_ids));

  SELECT COUNT(*)
  INTO v_deleted_completed_items
  FROM public.items i
  WHERE i.id = ANY(v_delete_item_ids)
    AND i.item_type IN ('task', 'subtask', 'project_task', 'project');

  SELECT COUNT(*)
  INTO v_reopened_recurring_tasks
  FROM public.items i
  WHERE i.id = ANY(v_keep_item_ids)
    AND i.item_type IN ('task', 'subtask', 'project_task')
    AND i.is_completed = true
    AND EXISTS (
      SELECT 1
      FROM public.time_events te
      WHERE te.user_id = v_user_id
        AND te.entity_type = 'task'
        AND te.entity_id = i.id
        AND te.recurrence IS NOT NULL
    );

  SELECT COUNT(*)
  INTO v_cleared_occurrences
  FROM public.time_occurrences
  WHERE user_id = v_user_id;

  SELECT COUNT(*)
  INTO v_cleared_notifications
  FROM public.notifications
  WHERE user_id = v_user_id;

  WITH normalized_items AS (
    SELECT
      i.id,
      CASE
        WHEN i.item_type = 'habit' THEN
          CASE
            WHEN COALESCE((i.metadata ->> 'isActive')::boolean, true)
              AND COALESCE((i.metadata ->> 'isChallenge')::boolean, false)
              AND NULLIF(i.metadata ->> 'challengeDurationDays', '') IS NOT NULL
            THEN jsonb_set(
              jsonb_set(
                (COALESCE(i.metadata, '{}'::jsonb) - 'completedAt' - 'archivedAt' - 'archivedToProject' - 'actualTime'),
                '{challengeStartDate}',
                to_jsonb(v_reset_at),
                true
              ),
              '{challengeEndDate}',
              to_jsonb(v_reset_at + make_interval(days => (i.metadata ->> 'challengeDurationDays')::integer)),
              true
            )
            ELSE (COALESCE(i.metadata, '{}'::jsonb) - 'completedAt' - 'archivedAt' - 'archivedToProject' - 'actualTime')
          END
        WHEN i.item_type = 'project' THEN
          jsonb_set(
            jsonb_set(
              (COALESCE(i.metadata, '{}'::jsonb) - 'completedAt' - 'archivedAt' - 'archivedToProject' - 'actualTime'),
              '{progress}',
              '0'::jsonb,
              true
            ),
            '{status}',
            to_jsonb(
              CASE
                WHEN COALESCE(i.metadata ->> 'status', 'planning') IN ('completed', 'archived')
                  THEN 'planning'
                ELSE COALESCE(i.metadata ->> 'status', 'planning')
              END
            ),
            true
          )
        ELSE (COALESCE(i.metadata, '{}'::jsonb) - 'completedAt' - 'archivedAt' - 'archivedToProject' - 'actualTime')
      END AS next_metadata
    FROM public.items i
    WHERE i.id = ANY(v_keep_item_ids)
  )
  UPDATE public.items i
  SET
    created_at = v_reset_at,
    updated_at = v_reset_at,
    is_completed = false,
    postpone_count = 0,
    metadata = normalized_items.next_metadata
  FROM normalized_items
  WHERE i.id = normalized_items.id;

  DELETE FROM public.time_occurrences
  WHERE user_id = v_user_id;

  DELETE FROM public.habit_completions
  WHERE user_id = v_user_id;

  DELETE FROM public.calendar_sync_jobs
  WHERE user_id = v_user_id;

  DELETE FROM public.time_events
  WHERE user_id = v_user_id
    AND entity_type = 'challenge';

  DELETE FROM public.time_events
  WHERE user_id = v_user_id
    AND entity_type IN ('task', 'habit')
    AND NOT (entity_id = ANY(v_keep_item_ids));

  WITH normalized_time_events AS (
    SELECT
      te.id,
      CASE
        WHEN te.entity_type = 'task' AND te.recurrence IS NOT NULL THEN
          GREATEST(
            v_reset_at,
            (
              (
                p_user_today::text || ' ' ||
                to_char(
                  te.starts_at AT TIME ZONE COALESCE(NULLIF(te.timezone, ''), 'Europe/Paris'),
                  'HH24:MI:SS'
                )
              )::timestamp AT TIME ZONE COALESCE(NULLIF(te.timezone, ''), 'Europe/Paris')
            )
          )
        ELSE te.starts_at
      END AS next_starts_at
    FROM public.time_events te
    WHERE te.user_id = v_user_id
      AND te.entity_type IN ('task', 'habit')
      AND te.entity_id = ANY(v_keep_item_ids)
  )
  UPDATE public.time_events te
  SET
    starts_at = normalized_time_events.next_starts_at,
    ends_at = CASE
      WHEN te.entity_type = 'task' AND te.recurrence IS NOT NULL THEN
        normalized_time_events.next_starts_at + make_interval(mins => te.duration)
      ELSE te.ends_at
    END,
    status = 'scheduled',
    completed_at = NULL,
    created_at = v_reset_at,
    updated_at = v_reset_at
  FROM normalized_time_events
  WHERE te.id = normalized_time_events.id;

  DELETE FROM public.items
  WHERE id = ANY(v_delete_item_ids);

  DELETE FROM public.xp_transactions
  WHERE user_id = v_user_id;

  DELETE FROM public.claim_history
  WHERE user_id = v_user_id;

  DELETE FROM public.user_skills
  WHERE user_id = v_user_id;

  DELETE FROM public.user_challenges
  WHERE user_id = v_user_id;

  UPDATE public.user_achievements
  SET
    current_progress = 0,
    is_unlocked = false,
    unlocked_at = NULL
  WHERE user_id = v_user_id;

  UPDATE public.user_progress
  SET
    total_xp = 0,
    current_level = 1,
    xp_for_next_level = 100,
    lifetime_points = 0,
    current_points = 0,
    tasks_completed = 0,
    habits_completed = 0,
    current_task_streak = 0,
    longest_task_streak = 0,
    current_habit_streak = 0,
    longest_habit_streak = 0,
    daily_challenge_streak = 0,
    weekly_challenges_completed = 0,
    last_activity_date = NULL,
    last_streak_qualified_date = NULL,
    points_available = 0,
    total_points_earned = 0,
    total_points_spent = 0,
    updated_at = v_reset_at
  WHERE user_id = v_user_id;

  DELETE FROM public.notifications
  WHERE user_id = v_user_id;

  DELETE FROM public.user_seen_updates
  WHERE user_id = v_user_id;

  DELETE FROM public.day_planning_config
  WHERE user_id = v_user_id
    AND date < v_today;

  UPDATE public.calendar_connections
  SET last_sync_error = NULL
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'reset_at', v_reset_at,
    'deleted_completed_items', v_deleted_completed_items,
    'reopened_recurring_tasks', v_reopened_recurring_tasks,
    'cleared_occurrences', v_cleared_occurrences,
    'cleared_notifications', v_cleared_notifications
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reset_account_history(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_account_history(date) TO authenticated;
