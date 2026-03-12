import type { Item, ItemContextType } from '@/types/item';
import type {
  StaleTaskRuleSettings,
  StaleTaskRuleState,
  TaskRuleAutoAction,
  TaskRuleMetadata,
} from '@/types/taskRules';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ELIGIBLE_CONTEXT_TYPES = new Set<ItemContextType>(['task', 'subtask', 'project_task']);

export interface StaleTaskRuleOutcome {
  ageDays: number;
  dueAlertCount: number;
  previousAlertCount: number;
  nextAlertCount: number;
  shouldCreateAlert: boolean;
  shouldApplyAutoAction: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pluralize(count: number, singular: string, plural: string): string {
  return count > 1 ? plural : singular;
}

export function isTaskRuleEligible(item: Pick<Item, 'contextType' | 'isCompleted'>): boolean {
  return !item.isCompleted && ELIGIBLE_CONTEXT_TYPES.has(item.contextType);
}

export function getTaskRuleMetadata(metadata?: Record<string, unknown>): TaskRuleMetadata {
  if (!metadata || !isRecord(metadata.ruleAlerts)) {
    return {};
  }

  const staleTask = isRecord(metadata.ruleAlerts.staleTask)
    ? {
        alertCount: typeof metadata.ruleAlerts.staleTask.alertCount === 'number'
          ? metadata.ruleAlerts.staleTask.alertCount
          : 0,
        lastAlertAt: typeof metadata.ruleAlerts.staleTask.lastAlertAt === 'string'
          ? metadata.ruleAlerts.staleTask.lastAlertAt
          : undefined,
        lastAlertAgeDays: typeof metadata.ruleAlerts.staleTask.lastAlertAgeDays === 'number'
          ? metadata.ruleAlerts.staleTask.lastAlertAgeDays
          : undefined,
        autoActionAppliedAt: typeof metadata.ruleAlerts.staleTask.autoActionAppliedAt === 'string'
          ? metadata.ruleAlerts.staleTask.autoActionAppliedAt
          : undefined,
        autoAction: typeof metadata.ruleAlerts.staleTask.autoAction === 'string'
          ? metadata.ruleAlerts.staleTask.autoAction as TaskRuleAutoAction
          : undefined,
      }
    : undefined;

  return { staleTask };
}

export function evaluateStaleTaskRule(
  item: Pick<Item, 'createdAt' | 'metadata' | 'contextType' | 'isCompleted'>,
  now: Date,
  settings: StaleTaskRuleSettings,
): StaleTaskRuleOutcome | null {
  if (!settings.enabled || !isTaskRuleEligible(item)) {
    return null;
  }

  const ageMs = Math.max(0, now.getTime() - item.createdAt.getTime());
  const firstAlertMs = settings.firstAlertAfterDays * MS_PER_DAY;

  if (ageMs < firstAlertMs) {
    return null;
  }

  const previousAlertCount = getTaskRuleMetadata(item.metadata as Record<string, unknown>).staleTask?.alertCount ?? 0;
  const repeatMs = settings.repeatEveryDays * MS_PER_DAY;
  const dueAlertCount = 1 + Math.floor((ageMs - firstAlertMs) / repeatMs);
  const cappedAlertCount = settings.autoAction === 'none'
    ? dueAlertCount
    : Math.min(dueAlertCount, settings.autoActionAfterAlerts);
  const ageDays = Math.floor(ageMs / MS_PER_DAY);
  const shouldApplyAutoAction = settings.autoAction !== 'none'
    && dueAlertCount >= settings.autoActionAfterAlerts
    && !getTaskRuleMetadata(item.metadata as Record<string, unknown>).staleTask?.autoActionAppliedAt;

  return {
    ageDays,
    dueAlertCount,
    previousAlertCount,
    nextAlertCount: Math.max(previousAlertCount, cappedAlertCount),
    shouldCreateAlert: cappedAlertCount > previousAlertCount,
    shouldApplyAutoAction,
  };
}

export function createNextStaleTaskRuleState(
  previous: StaleTaskRuleState | undefined,
  outcome: StaleTaskRuleOutcome,
  settings: StaleTaskRuleSettings,
  now: Date,
): StaleTaskRuleState {
  return {
    alertCount: outcome.nextAlertCount,
    lastAlertAt: outcome.shouldCreateAlert ? now.toISOString() : previous?.lastAlertAt,
    lastAlertAgeDays: outcome.ageDays,
    autoActionAppliedAt: outcome.shouldApplyAutoAction
      ? now.toISOString()
      : previous?.autoActionAppliedAt,
    autoAction: outcome.shouldApplyAutoAction
      ? settings.autoAction
      : previous?.autoAction,
  };
}

export function getTaskRuleAutoActionLabel(action: TaskRuleAutoAction): string {
  switch (action) {
    case 'pin':
      return 'épingler la tâche';
    case 'mark-important':
      return 'la marquer importante';
    case 'mark-urgent':
      return 'la marquer urgente';
    case 'make-obligation':
      return 'la faire passer en obligation';
    case 'none':
    default:
      return 'ne rien faire automatiquement';
  }
}

export function buildStaleTaskNotification(
  itemName: string,
  outcome: StaleTaskRuleOutcome,
  settings: StaleTaskRuleSettings,
): { title: string; message: string } {
  const alertLabel = `Alerte ${outcome.nextAlertCount}`;
  const title = `${alertLabel} - ${itemName}`;
  const dayLabel = pluralize(outcome.ageDays, 'jour', 'jours');
  const actionPreview = settings.autoAction === 'none'
    ? "Aucune action automatique n'est prévue."
    : outcome.shouldApplyAutoAction
      ? `Action automatique appliquée : ${getTaskRuleAutoActionLabel(settings.autoAction)}.`
      : `Action automatique à la ${settings.autoActionAfterAlerts}e alerte : ${getTaskRuleAutoActionLabel(settings.autoAction)}.`;

  return {
    title,
    message: `${itemName} n'est toujours pas terminée après ${outcome.ageDays} ${dayLabel}. ${actionPreview}`,
  };
}
