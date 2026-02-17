// ============= Reward Engine =============
// Pure, deterministic calculation module — no side effects

import {
  QUADRANT_COEFFICIENTS,
  ANTI_ZOMBIE_THRESHOLD,
  ANTI_ZOMBIE_BONUS,
  PLANNING_BONUS_LONG,
  PLANNING_BONUS_SHORT,
  PLANNING_THRESHOLD_HOURS,
  MICRO_TASK_MAX_MINUTES,
  MICRO_TASK_DAILY_CAP,
  STREAK_MIN_IMPORTANT_MINUTES,
  STREAK_MIN_TASK_DURATION,
} from './constants';

// ---- Types ----

export interface TaskRewardInput {
  durationMinutes: number;
  isImportant: boolean;
  isUrgent: boolean;
  postponeCount: number;
  scheduledAt?: Date | string | null;
  completedAt: Date | string;
}

export interface TaskRewardResult {
  points: number;
  base: number;
  quadrantKey: string;
  quadrantCoeff: number;
  bonusType: 'anti-zombie' | 'planning-long' | 'planning-short' | 'none';
  bonusValue: number;
  isMicroTask: boolean;
  formula: string;
}

export interface WeeklyTaskEntry {
  durationMinutes: number;
  isImportant: boolean;
  isUrgent: boolean;
  points: number;
}

export interface WeeklySummary {
  pctImportantNotUrgent: number;
  pctUrgent: number;
  pctMaintenance: number;
  alignmentScore: number;
  totalMinutes: number;
  totalPoints: number;
}

// ---- Helpers ----

function getQuadrantKey(isImportant: boolean, isUrgent: boolean): keyof typeof QUADRANT_COEFFICIENTS {
  if (isImportant && isUrgent) return 'urgent-important';
  if (isImportant && !isUrgent) return 'important-not-urgent';
  if (!isImportant && isUrgent) return 'urgent-not-important';
  return 'not-urgent-not-important';
}

function toDate(d: Date | string): Date {
  return typeof d === 'string' ? new Date(d) : d;
}

// ---- Core Functions ----

/**
 * Compute points for a single completed task.
 * Formula: Math.round(sqrt(duration) × quadrantCoeff × bonusValue)
 */
export function computeTaskPoints(input: TaskRewardInput): TaskRewardResult {
  const { durationMinutes, isImportant, isUrgent, postponeCount, scheduledAt, completedAt } = input;

  // 1. Base effort
  const base = Math.sqrt(Math.max(durationMinutes, 0));

  // 2. Quadrant coefficient
  const quadrantKey = getQuadrantKey(isImportant, isUrgent);
  const quadrantCoeff = QUADRANT_COEFFICIENTS[quadrantKey];

  // 3. Bonus (exclusive, anti-zombie takes priority)
  let bonusType: TaskRewardResult['bonusType'] = 'none';
  let bonusValue = 1.0;

  if (postponeCount >= ANTI_ZOMBIE_THRESHOLD) {
    bonusType = 'anti-zombie';
    bonusValue = ANTI_ZOMBIE_BONUS;
  } else if (scheduledAt && completedAt) {
    const scheduled = toDate(scheduledAt);
    const completed = toDate(completedAt);
    const diffHours = (completed.getTime() - scheduled.getTime()) / (1000 * 60 * 60);

    if (diffHours > PLANNING_THRESHOLD_HOURS) {
      bonusType = 'planning-long';
      bonusValue = PLANNING_BONUS_LONG;
    } else if (diffHours > 0) {
      bonusType = 'planning-short';
      bonusValue = PLANNING_BONUS_SHORT;
    }
  }

  // 4. Final score
  const points = Math.round(base * quadrantCoeff * bonusValue);

  const isMicroTask = durationMinutes <= MICRO_TASK_MAX_MINUTES;

  const formula = `√${durationMinutes} × ${quadrantCoeff} × ${bonusValue} = ${points}`;

  return {
    points,
    base,
    quadrantKey,
    quadrantCoeff,
    bonusType,
    bonusValue,
    isMicroTask,
    formula,
  };
}

/**
 * Check if a micro-task can still score today.
 * Returns true if under the daily cap.
 */
export function checkMicroTaskCap(microTasksCompletedToday: number): boolean {
  return microTasksCompletedToday < MICRO_TASK_DAILY_CAP;
}

/**
 * Check if a day qualifies for streak increment.
 * Only important tasks with duration > 10 min count.
 */
export function checkStreakDay(importantMinutesToday: number): boolean {
  return importantMinutesToday >= STREAK_MIN_IMPORTANT_MINUTES;
}

/**
 * Compute weekly summary from completed tasks.
 */
export function computeWeeklySummary(tasks: WeeklyTaskEntry[]): WeeklySummary {
  const totalMinutes = tasks.reduce((s, t) => s + t.durationMinutes, 0);
  const totalPoints = tasks.reduce((s, t) => s + t.points, 0);

  let minImportantNotUrgent = 0;
  let minUrgent = 0;
  let minMaintenance = 0;
  let ptsImportantNotUrgent = 0;

  for (const t of tasks) {
    if (t.isImportant && !t.isUrgent) {
      minImportantNotUrgent += t.durationMinutes;
      ptsImportantNotUrgent += t.points;
    } else if (t.isUrgent) {
      // Urgent regroups Important+Urgent and Urgent-only
      minUrgent += t.durationMinutes;
    } else {
      minMaintenance += t.durationMinutes;
    }
  }

  return {
    pctImportantNotUrgent: totalMinutes > 0 ? Math.round((minImportantNotUrgent / totalMinutes) * 100) : 0,
    pctUrgent: totalMinutes > 0 ? Math.round((minUrgent / totalMinutes) * 100) : 0,
    pctMaintenance: totalMinutes > 0 ? Math.round((minMaintenance / totalMinutes) * 100) : 0,
    alignmentScore: totalPoints > 0 ? Math.round((ptsImportantNotUrgent / totalPoints) * 100) : 0,
    totalMinutes,
    totalPoints,
  };
}

/**
 * Check if a task counts towards important minutes for streak.
 * Must be Important=true and duration > STREAK_MIN_TASK_DURATION.
 */
export function isStreakEligible(isImportant: boolean, durationMinutes: number): boolean {
  return isImportant && durationMinutes > STREAK_MIN_TASK_DURATION;
}
