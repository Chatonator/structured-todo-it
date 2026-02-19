/**
 * RecoveryEngine - Automatic recovery break calculation
 * Creates scientifically-backed breaks after task scheduling
 */

import { TimeEvent } from './types';

// --- Constants ---
export const BREAK_RATIO = 0.2;          // 20% of task duration
export const MIN_BREAK = 5;               // Minimum 5 minutes
export const MAX_BREAK = 20;              // Maximum 20 minutes
export const LONG_TASK_THRESHOLD = 30;    // Tasks >= 30 min trigger a break
export const ACCUMULATION_THRESHOLD = 60; // 60 min cumulative work triggers a break
export const ROUND_TO = 5;               // Round to nearest 5 minutes

// Scientifically-validated recovery suggestions
export const RECOVERY_SUGGESTIONS = [
  { label: 'Marche', icon: '🚶' },
  { label: 'Étirements', icon: '🧘' },
  { label: 'Respiration lente', icon: '🌬️' },
  { label: 'Hydratation', icon: '💧' },
  { label: 'Pause sans écran', icon: '👁️' },
] as const;

export type RecoverySuggestion = typeof RECOVERY_SUGGESTIONS[number];

/**
 * Calculate break duration: 20% of task duration, rounded to 5 min, clamped [5, 20]
 */
export function calculateBreakDuration(taskDurationMinutes: number): number {
  const raw = taskDurationMinutes * BREAK_RATIO;
  const rounded = Math.round(raw / ROUND_TO) * ROUND_TO;
  return Math.max(MIN_BREAK, Math.min(MAX_BREAK, rounded || MIN_BREAK));
}

/**
 * Get cumulative work time without a break in the current block events
 */
export function getCumulativeWorkWithoutBreak(blockEvents: TimeEvent[]): number {
  // Sort by start time descending to find the most recent break
  const sorted = [...blockEvents].sort(
    (a, b) => b.startsAt.getTime() - a.startsAt.getTime()
  );

  let cumulative = 0;
  for (const event of sorted) {
    if (event.entityType === 'recovery') break; // Stop at last break
    if (event.status === 'cancelled') continue;
    cumulative += event.duration;
  }
  return cumulative;
}

/**
 * Determine if a break should be created after scheduling a task
 */
export function shouldCreateBreak(
  taskDuration: number,
  isImportant: boolean,
  blockEvents: TimeEvent[]
): boolean {
  // Rule 1: Long task (>= 30 min)
  if (taskDuration >= LONG_TASK_THRESHOLD) return true;

  // Rule 2: Important task (any duration)
  if (isImportant) return true;

  // Rule 3: Cumulative work >= 60 min without a break
  const cumulative = getCumulativeWorkWithoutBreak(blockEvents) + taskDuration;
  if (cumulative >= ACCUMULATION_THRESHOLD) return true;

  return false;
}

/**
 * Pick a random recovery suggestion
 */
export function getRandomSuggestion(): RecoverySuggestion {
  const idx = Math.floor(Math.random() * RECOVERY_SUGGESTIONS.length);
  return RECOVERY_SUGGESTIONS[idx];
}

/**
 * Build a recovery break title from a suggestion and duration
 */
export function buildBreakTitle(suggestion: RecoverySuggestion, durationMinutes: number): string {
  return `${suggestion.icon} ${suggestion.label} – ${durationMinutes} min`;
}
