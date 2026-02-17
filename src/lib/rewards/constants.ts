// ============= Reward Engine Constants =============
// All configuration values for the deterministic reward system

export const QUADRANT_COEFFICIENTS = {
  'urgent-important': 1.5,
  'important-not-urgent': 1.6,
  'urgent-not-important': 1.0,
  'not-urgent-not-important': 0.7,
} as const;

// Anti-zombie bonus (tasks postponed >= threshold times)
export const ANTI_ZOMBIE_THRESHOLD = 3;
export const ANTI_ZOMBIE_BONUS = 1.5;

// Planning bonuses (exclusive with anti-zombie)
export const PLANNING_BONUS_LONG = 1.20;   // Scheduled >48h before completion
export const PLANNING_BONUS_SHORT = 1.10;  // Scheduled <=48h before completion
export const PLANNING_THRESHOLD_HOURS = 48;

// Micro-task rules
export const MICRO_TASK_MAX_MINUTES = 10;
export const MICRO_TASK_DAILY_CAP = 5;

// Streak rules
export const STREAK_MIN_IMPORTANT_MINUTES = 30;
export const STREAK_MIN_TASK_DURATION = 10;  // Only tasks >10min count for streak
