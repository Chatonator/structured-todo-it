// ============= Reward Engine v2.0 =============
// Pure, deterministic calculation module — no side effects

import {
  QUADRANT_COEFFICIENTS,
  ANTI_ZOMBIE_THRESHOLD,
  ANTI_ZOMBIE_BONUS,
  DEADLINE_BONUS,
  MICRO_TASK_MAX_MINUTES,
  MICRO_TASK_EFFORT_FACTOR,
  MICRO_TASK_DAILY_CAP,
  LONG_TASK_THRESHOLD_MINUTES,
  LONG_TASK_BONUS,
  STREAK_MIN_IMPORTANT_MINUTES,
  STREAK_MIN_TASK_DURATION,
  SKILL_LEVEL_THRESHOLDS,
} from './constants';

// ---- Types ----

export interface TaskRewardInput {
  durationMinutes: number;
  isImportant: boolean;
  isUrgent: boolean;
  postponeCount: number;
  /** Whether deadline is < 48h (for secondary bonus) */
  hasUrgentDeadline?: boolean;
}

export interface TaskRewardResult {
  points: number;
  base: number;
  quadrantKey: string;
  quadrantCoeff: number;
  importanceWeight: number;
  priorityMultiplier: number;
  bonusType: 'anti-zombie' | 'deadline' | 'none';
  bonusValue: number;
  longTaskBonus: number;
  isMicroTask: boolean;
  formula: string;
  /** Quadrant label for toast feedback */
  quadrantLabel: string;
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

function getQuadrantLabel(isImportant: boolean, isUrgent: boolean): string {
  if (isImportant && !isUrgent) return 'Long terme';
  if (isImportant && isUrgent) return 'Urgence traitée';
  if (!isImportant && isUrgent) return 'Urgence';
  return 'Maintenance';
}

// ---- Core Functions ----

/**
 * Compute points for a single completed task (v2.0 formula).
 */
export function computeTaskPoints(input: TaskRewardInput): TaskRewardResult {
  const { durationMinutes, isImportant, isUrgent, postponeCount, hasUrgentDeadline } = input;

  // 1. Effort compressé
  let base = Math.sqrt(Math.max(durationMinutes, 0));

  // 2. Micro-task adjust
  const isMicroTask = durationMinutes < MICRO_TASK_MAX_MINUTES;
  if (isMicroTask) {
    base *= MICRO_TASK_EFFORT_FACTOR;
  }

  // 3. Importance weight
  const importanceWeight = isImportant ? 2 : 1;

  // 4. Quadrant weight
  const quadrantKey = getQuadrantKey(isImportant, isUrgent);
  const quadrantCoeff = QUADRANT_COEFFICIENTS[quadrantKey];

  // 5. Priority multiplier
  const priorityMultiplier = (importanceWeight + quadrantCoeff) / 2;

  // 6. Secondary bonus (non-cumulative)
  let bonusType: TaskRewardResult['bonusType'] = 'none';
  let bonusValue = 1.0;

  if (postponeCount >= ANTI_ZOMBIE_THRESHOLD) {
    bonusType = 'anti-zombie';
    bonusValue = ANTI_ZOMBIE_BONUS;
  } else if (isImportant && hasUrgentDeadline) {
    bonusType = 'deadline';
    bonusValue = DEADLINE_BONUS;
  }

  // 7. Long task bonus (additive)
  const longTaskBonus = durationMinutes >= LONG_TASK_THRESHOLD_MINUTES ? LONG_TASK_BONUS : 0;

  // 8. Final calculation
  const points = Math.floor(base * priorityMultiplier * bonusValue) + longTaskBonus;

  const quadrantLabel = getQuadrantLabel(isImportant, isUrgent);
  const formula = `⌊√${durationMinutes}${isMicroTask ? '×0.6' : ''} × ${priorityMultiplier.toFixed(2)} × ${bonusValue}⌋${longTaskBonus > 0 ? ` + ${longTaskBonus}` : ''} = ${points}`;

  return {
    points,
    base,
    quadrantKey,
    quadrantCoeff,
    importanceWeight,
    priorityMultiplier,
    bonusType,
    bonusValue,
    longTaskBonus,
    isMicroTask,
    formula,
    quadrantLabel,
  };
}

/**
 * Check if a micro-task can still score today.
 */
export function checkMicroTaskCap(microTasksCompletedToday: number): boolean {
  return microTasksCompletedToday < MICRO_TASK_DAILY_CAP;
}

/**
 * Check if a day qualifies for streak increment.
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
 */
export function isStreakEligible(isImportant: boolean, durationMinutes: number): boolean {
  return isImportant && durationMinutes > STREAK_MIN_TASK_DURATION;
}

/**
 * Compute skill level from XP.
 */
export function computeSkillLevel(xp: number): { level: number; progressPct: number; xpForNext: number } {
  let level = 1;
  for (let i = SKILL_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= SKILL_LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  const currentThreshold = SKILL_LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = SKILL_LEVEL_THRESHOLDS[level] ?? currentThreshold + 500;
  const range = nextThreshold - currentThreshold;
  const progressPct = range > 0 ? Math.round(((xp - currentThreshold) / range) * 100) : 100;

  return { level, progressPct, xpForNext: nextThreshold };
}
