/**
 * RecoveryEngine - Automatic recovery break calculation
 * Creates scientifically-backed breaks after task scheduling
 */

import { TimeEvent } from './types';

// --- Constants ---
export const LONG_TASK_THRESHOLD = 30;    // Tasks >= 30 min trigger a break
export const ACCUMULATION_THRESHOLD = 30; // 30 min cumulative work triggers a break
export const ROUND_TO = 5;               // Round to nearest 5 minutes

// Duration-based break thresholds (biologically correct)
export const BREAK_THRESHOLDS = [
  { min: 90, breakMinutes: 20 },
  { min: 60, breakMinutes: 15 },
  { min: 45, breakMinutes: 10 },
  { min: 30, breakMinutes: 5 },
] as const;

// Suggestions grouped by break duration
export const RECOVERY_SUGGESTIONS: Record<number, { label: string; icon: string }[]> = {
  5: [
    { label: 'Marcher 3–5 minutes', icon: '🚶' },
    { label: 'Respiration lente 2–3 min', icon: '🌬️' },
    { label: 'Regarder au loin + boire de l\'eau', icon: '💧' },
  ],
  10: [
    { label: 'Marche légère', icon: '🚶' },
    { label: 'Étirements / mobilité', icon: '🧘' },
    { label: 'Boisson chaude au calme', icon: '☕' },
  ],
  15: [
    { label: 'Marche 10–15 min (extérieur)', icon: '🌿' },
    { label: 'Mini séance mobilité / yoga', icon: '🧘' },
    { label: 'Lecture légère (papier)', icon: '📖' },
  ],
  20: [
    { label: 'Marche complète dehors', icon: '🌳' },
    { label: 'Power nap 15–20 min', icon: '😴' },
    { label: 'Méditation guidée', icon: '🧘‍♂️' },
  ],
};

export type RecoverySuggestion = { label: string; icon: string };

/**
 * Calculate break duration from biologically-correct thresholds
 * < 30 min → 0 (no break)
 * 30–44 → 5 min
 * 45–59 → 10 min
 * 60–89 → 15 min
 * ≥ 90 → 20 min
 */
export function calculateBreakDuration(workMinutes: number): number {
  for (const threshold of BREAK_THRESHOLDS) {
    if (workMinutes >= threshold.min) return threshold.breakMinutes;
  }
  return 0;
}

/**
 * Get cumulative work time without a break in the current block events
 */
export function getCumulativeWorkWithoutBreak(blockEvents: TimeEvent[]): number {
  const sorted = [...blockEvents].sort(
    (a, b) => b.startsAt.getTime() - a.startsAt.getTime()
  );

  let cumulative = 0;
  for (const event of sorted) {
    if (event.entityType === 'recovery') break;
    if (event.status === 'cancelled') continue;
    cumulative += event.duration;
  }
  return cumulative;
}

/**
 * Determine if a break should be created after scheduling a task.
 * Returns the effective work duration to use for break calculation, or 0 if no break needed.
 */
export function getEffectiveWorkDuration(
  taskDuration: number,
  isImportant: boolean,
  blockEvents: TimeEvent[]
): number {
  // Rule 1: Long task (>= 30 min) — use task duration directly
  if (taskDuration >= LONG_TASK_THRESHOLD) return taskDuration;

  // Rule 2: Important task — always break (min 30 to get at least 5 min break)
  if (isImportant) return Math.max(taskDuration, LONG_TASK_THRESHOLD);

  // Rule 3: Accumulation — cumulative work without break
  const cumulative = getCumulativeWorkWithoutBreak(blockEvents) + taskDuration;
  if (cumulative >= ACCUMULATION_THRESHOLD) return cumulative;

  return 0;
}

/**
 * Legacy wrapper — returns boolean
 */
export function shouldCreateBreak(
  taskDuration: number,
  isImportant: boolean,
  blockEvents: TimeEvent[]
): boolean {
  return getEffectiveWorkDuration(taskDuration, isImportant, blockEvents) > 0;
}

/**
 * Pick a suggestion appropriate for the break duration (with rotation)
 */
export function getSuggestionForDuration(breakMinutes: number): RecoverySuggestion {
  const bucket = RECOVERY_SUGGESTIONS[breakMinutes] || RECOVERY_SUGGESTIONS[5];
  const idx = Math.floor(Math.random() * bucket.length);
  return bucket[idx];
}

/**
 * Build a recovery break title
 */
export function buildBreakTitle(suggestion: RecoverySuggestion, durationMinutes: number): string {
  return `${suggestion.icon} ${suggestion.label} – ${durationMinutes} min`;
}

/**
 * Plan of breaks for a block: returns a list of { afterTaskId, breakDuration }
 * Walks through tasks in order, accumulates work time, and triggers breaks
 * whenever a threshold is crossed (single task long enough, important, or accumulation).
 */
export interface PlannedBreak {
  afterTaskId: string;
  afterTaskEndsAt: Date;
  breakDuration: number;
  block?: string;
}

export function computeBlockBreaks(
  taskEvents: TimeEvent[],
  allTasks?: { id: string; isImportant?: boolean }[]
): PlannedBreak[] {
  // Sort task events by startsAt
  const sorted = [...taskEvents]
    .filter(e => e.entityType === 'task' && e.status !== 'cancelled')
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const breaks: PlannedBreak[] = [];
  let accumulatedWork = 0;

  for (const event of sorted) {
    const taskDuration = event.duration;
    const taskInfo = allTasks?.find(t => t.id === event.entityId);
    const isImportant = taskInfo?.isImportant ?? false;

    accumulatedWork += taskDuration;

    // Check if this individual task or accumulation triggers a break
    let effectiveDuration = 0;

    if (taskDuration >= LONG_TASK_THRESHOLD) {
      // Long task: use task duration
      effectiveDuration = taskDuration;
    } else if (isImportant) {
      // Important task: force at least 30 to trigger minimum break
      effectiveDuration = Math.max(accumulatedWork, LONG_TASK_THRESHOLD);
    } else if (accumulatedWork >= ACCUMULATION_THRESHOLD) {
      // Accumulation threshold reached
      effectiveDuration = accumulatedWork;
    }

    if (effectiveDuration > 0) {
      const breakDur = calculateBreakDuration(effectiveDuration);
      if (breakDur > 0) {
        const endsAt = event.endsAt || new Date(event.startsAt.getTime() + taskDuration * 60 * 1000);
        breaks.push({
          afterTaskId: event.entityId,
          afterTaskEndsAt: endsAt,
          breakDuration: breakDur,
          block: event.timeBlock,
        });
        // Reset accumulation after a break
        accumulatedWork = 0;
      }
    }
  }

  return breaks;
}
