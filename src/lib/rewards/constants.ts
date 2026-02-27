// ============= Reward Engine Constants v2.0 =============

export const QUADRANT_COEFFICIENTS = {
  'urgent-important': 1.4,
  'important-not-urgent': 1.5,
  'urgent-not-important': 1.0,
  'not-urgent-not-important': 0.6,
} as const;

// Anti-zombie bonus (tasks postponed >= threshold times)
export const ANTI_ZOMBIE_THRESHOLD = 3;
export const ANTI_ZOMBIE_BONUS = 1.3;

// Deadline bonus (important + deadline < 48h)
export const DEADLINE_BONUS = 1.2;

// Micro-task rules (duration < 15 min → effort × 0.6)
export const MICRO_TASK_MAX_MINUTES = 15;
export const MICRO_TASK_EFFORT_FACTOR = 0.6;
export const MICRO_TASK_DAILY_CAP = 5;

// Long task bonus (additive, duration >= 60 min)
export const LONG_TASK_THRESHOLD_MINUTES = 60;
export const LONG_TASK_BONUS = 5;

// Streak rules
export const STREAK_MIN_IMPORTANT_MINUTES = 30;
export const STREAK_MIN_TASK_DURATION = 10;

// Goal gradient thresholds
export const POINT_THRESHOLDS = [30, 60, 120, 240] as const;

// Skill level thresholds
export const SKILL_LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500] as const;

// Decay constants for unrefined points
export const DECAY_RATE_PER_WEEK = 0.10;
export const MAX_DECAY_WEEKS = 10;
