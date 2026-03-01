// ============= Reward Engine v3.0 — Guilty-Free Time =============
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
  GAUGE_MAX_MINUTES,
  COMPENSATION_THRESHOLD,
  COMPENSATION_BONUS,
} from './constants';

// ---- Types ----

export interface TaskRewardInput {
  durationMinutes: number;
  isImportant: boolean;
  isUrgent: boolean;
  postponeCount: number;
  hasUrgentDeadline?: boolean;
}

export interface TaskRewardResult {
  minutes: number;
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
  quadrantLabel: string;
}

export interface WeeklyTaskEntry {
  durationMinutes: number;
  isImportant: boolean;
  isUrgent: boolean;
  minutes: number;
}

export interface WeeklySummary {
  pctImportantNotUrgent: number;
  pctUrgent: number;
  pctMaintenance: number;
  alignmentScore: number;
  totalMinutes: number;
  totalGuiltyFreeMinutes: number;
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
 * Compute guilty-free minutes for a single completed task.
 */
export function computeTaskMinutes(input: TaskRewardInput): TaskRewardResult {
  const { durationMinutes, isImportant, isUrgent, postponeCount, hasUrgentDeadline } = input;

  let base = Math.sqrt(Math.max(durationMinutes, 0));

  const isMicroTask = durationMinutes < MICRO_TASK_MAX_MINUTES;
  if (isMicroTask) {
    base *= MICRO_TASK_EFFORT_FACTOR;
  }

  const importanceWeight = isImportant ? 2 : 1;
  const quadrantKey = getQuadrantKey(isImportant, isUrgent);
  const quadrantCoeff = QUADRANT_COEFFICIENTS[quadrantKey];
  const priorityMultiplier = (importanceWeight + quadrantCoeff) / 2;

  let bonusType: TaskRewardResult['bonusType'] = 'none';
  let bonusValue = 1.0;

  if (postponeCount >= ANTI_ZOMBIE_THRESHOLD) {
    bonusType = 'anti-zombie';
    bonusValue = ANTI_ZOMBIE_BONUS;
  } else if (isImportant && hasUrgentDeadline) {
    bonusType = 'deadline';
    bonusValue = DEADLINE_BONUS;
  }

  const longTaskBonus = durationMinutes >= LONG_TASK_THRESHOLD_MINUTES ? LONG_TASK_BONUS : 0;
  const minutes = Math.floor(base * priorityMultiplier * bonusValue) + longTaskBonus;

  const quadrantLabel = getQuadrantLabel(isImportant, isUrgent);
  const formula = `⌊√${durationMinutes}${isMicroTask ? '×0.6' : ''} × ${priorityMultiplier.toFixed(2)} × ${bonusValue}⌋${longTaskBonus > 0 ? ` + ${longTaskBonus}` : ''} = ${minutes} min`;

  return {
    minutes,
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

/** @deprecated Use computeTaskMinutes instead */
export const computeTaskPoints = computeTaskMinutes;

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
 * Clamp a value to the gauge maximum (200 min). Excess is lost.
 */
export function clampToGauge(value: number): number {
  return Math.min(value, GAUGE_MAX_MINUTES);
}

/**
 * Compute compensation bonus: +10 min for each 60-min tranche crossed.
 * Returns the bonus minutes to add (before clamping).
 */
export function computeCompensationBonus(currentMinutes: number, addedMinutes: number): number {
  const before = Math.floor(currentMinutes / COMPENSATION_THRESHOLD);
  const after = Math.floor((currentMinutes + addedMinutes) / COMPENSATION_THRESHOLD);
  const tranchesCrossed = after - before;
  return tranchesCrossed > 0 ? tranchesCrossed * COMPENSATION_BONUS : 0;
}

/**
 * Compute weekly summary from completed tasks.
 */
export function computeWeeklySummary(tasks: WeeklyTaskEntry[]): WeeklySummary {
  const totalMinutes = tasks.reduce((s, t) => s + t.durationMinutes, 0);
  const totalGuiltyFreeMinutes = tasks.reduce((s, t) => s + t.minutes, 0);

  let minImportantNotUrgent = 0;
  let minUrgent = 0;
  let minMaintenance = 0;
  let minsImportantNotUrgent = 0;

  for (const t of tasks) {
    if (t.isImportant && !t.isUrgent) {
      minImportantNotUrgent += t.durationMinutes;
      minsImportantNotUrgent += t.minutes;
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
    alignmentScore: totalGuiltyFreeMinutes > 0 ? Math.round((minsImportantNotUrgent / totalGuiltyFreeMinutes) * 100) : 0,
    totalMinutes,
    totalGuiltyFreeMinutes,
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
