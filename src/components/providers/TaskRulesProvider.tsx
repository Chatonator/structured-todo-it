import React, { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useItems } from '@/hooks/useItems';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import type { Item, ItemContextType, ItemMetadata } from '@/types/item';
import type { TaskRuleAutoAction } from '@/types/taskRules';
import {
  buildStaleTaskNotification,
  createNextStaleTaskRuleState,
  evaluateStaleTaskRule,
  getTaskRuleMetadata,
} from '@/lib/task-rules/engine';
import { logger } from '@/lib/logger';

const RULE_CONTEXT_TYPES: ItemContextType[] = ['task', 'subtask', 'project_task'];
const RULE_EVALUATION_INTERVAL_MS = 30 * 60 * 1000;

function buildItemUpdates(
  item: Item,
  nextState: ReturnType<typeof createNextStaleTaskRuleState>,
  autoAction: TaskRuleAutoAction | undefined,
): Partial<Item> {
  const currentRuleMetadata = getTaskRuleMetadata(item.metadata as Record<string, unknown>);
  const metadataUpdates: Partial<ItemMetadata> = {
    ruleAlerts: {
      ...currentRuleMetadata,
      staleTask: nextState,
    },
  };
  const updates: Partial<Item> = { metadata: metadataUpdates };

  switch (autoAction) {
    case 'pin':
      updates.isPinned = true;
      break;
    case 'mark-important':
      metadataUpdates.isImportant = true;
      break;
    case 'mark-urgent':
      metadataUpdates.isUrgent = true;
      break;
    case 'make-obligation':
      metadataUpdates.isImportant = true;
      metadataUpdates.isUrgent = true;
      break;
    default:
      break;
  }

  return updates;
}

export const TaskRulesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();
  const { items, loading, updateItem } = useItems({
    contextTypes: RULE_CONTEXT_TYPES,
    includeCompleted: false,
    enabled: Boolean(user && preferences.taskRules.staleTask.enabled),
  });
  const evaluatingRef = useRef(false);

  const evaluateRules = useCallback(async () => {
    if (!user || !preferences.taskRules.staleTask.enabled || loading || evaluatingRef.current) {
      return;
    }

    evaluatingRef.current = true;
    const now = new Date();

    try {
      for (const item of items) {
        const outcome = evaluateStaleTaskRule(item, now, preferences.taskRules.staleTask);
        if (!outcome || (!outcome.shouldCreateAlert && !outcome.shouldApplyAutoAction)) {
          continue;
        }

        const previousState = getTaskRuleMetadata(item.metadata as Record<string, unknown>).staleTask;
        const nextState = createNextStaleTaskRuleState(previousState, outcome, preferences.taskRules.staleTask, now);
        const autoAction = outcome.shouldApplyAutoAction ? preferences.taskRules.staleTask.autoAction : undefined;
        const updates = buildItemUpdates(item, nextState, autoAction);

        await updateItem(item.id, updates);

        if (outcome.shouldCreateAlert) {
          const notification = buildStaleTaskNotification(item.name, outcome, preferences.taskRules.staleTask);
          const { error } = await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'warning',
            title: notification.title,
            message: notification.message,
            metadata: {
              action: 'task_rule_alert',
              ruleType: 'stale-task',
              itemId: item.id,
              itemName: item.name,
              alertCount: outcome.nextAlertCount,
              ageDays: outcome.ageDays,
              autoAction: autoAction ?? 'none',
            },
          });

          if (error) {
            logger.warn('Task rule notification insert failed', { itemId: item.id, error: error.message });
          }
        }
      }
    } catch (error) {
      logger.error('Task rule evaluation failed', { userId: user.id }, error instanceof Error ? error : undefined);
    } finally {
      evaluatingRef.current = false;
    }
  }, [items, loading, preferences.taskRules.staleTask, updateItem, user]);

  useEffect(() => {
    if (!user || !preferences.taskRules.staleTask.enabled || loading) {
      return;
    }

    void evaluateRules();
  }, [evaluateRules, loading, preferences.taskRules.staleTask.enabled, user]);

  useEffect(() => {
    if (!user || !preferences.taskRules.staleTask.enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void evaluateRules();
    }, RULE_EVALUATION_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void evaluateRules();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [evaluateRules, preferences.taskRules.staleTask.enabled, user]);

  return <>{children}</>;
};

export default TaskRulesProvider;
