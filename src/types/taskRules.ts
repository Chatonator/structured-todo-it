export type TaskRuleAutoAction =
  | 'none'
  | 'pin'
  | 'mark-important'
  | 'mark-urgent'
  | 'make-obligation';

export interface StaleTaskRuleSettings {
  enabled: boolean;
  firstAlertAfterDays: number;
  repeatEveryDays: number;
  autoActionAfterAlerts: number;
  autoAction: TaskRuleAutoAction;
}

export interface TaskRulePreferences {
  staleTask: StaleTaskRuleSettings;
}

export interface StaleTaskRuleState {
  alertCount: number;
  lastAlertAt?: string;
  lastAlertAgeDays?: number;
  autoActionAppliedAt?: string;
  autoAction?: TaskRuleAutoAction;
}

export interface TaskRuleMetadata {
  staleTask?: StaleTaskRuleState;
}

export const DEFAULT_TASK_RULE_PREFERENCES: TaskRulePreferences = {
  staleTask: {
    enabled: false,
    firstAlertAfterDays: 7,
    repeatEveryDays: 7,
    autoActionAfterAlerts: 3,
    autoAction: 'pin',
  },
};

const TASK_RULE_AUTO_ACTIONS: TaskRuleAutoAction[] = [
  'none',
  'pin',
  'mark-important',
  'mark-urgent',
  'make-obligation',
];

function isTaskRuleAutoAction(value: unknown): value is TaskRuleAutoAction {
  return typeof value === 'string' && TASK_RULE_AUTO_ACTIONS.includes(value as TaskRuleAutoAction);
}

function clampPositiveInteger(value: unknown, fallback: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(max, Math.round(value)));
}

export function normalizeTaskRulePreferences(stored?: Partial<TaskRulePreferences> | null): TaskRulePreferences {
  const staleTask: Partial<StaleTaskRuleSettings> = stored?.staleTask ?? {};
  const defaults = DEFAULT_TASK_RULE_PREFERENCES.staleTask;

  return {
    staleTask: {
      enabled: typeof staleTask.enabled === 'boolean' ? staleTask.enabled : defaults.enabled,
      firstAlertAfterDays: clampPositiveInteger(staleTask.firstAlertAfterDays, defaults.firstAlertAfterDays, 365),
      repeatEveryDays: clampPositiveInteger(staleTask.repeatEveryDays, defaults.repeatEveryDays, 365),
      autoActionAfterAlerts: clampPositiveInteger(staleTask.autoActionAfterAlerts, defaults.autoActionAfterAlerts, 20),
      autoAction: isTaskRuleAutoAction(staleTask.autoAction) ? staleTask.autoAction : defaults.autoAction,
    },
  };
}
