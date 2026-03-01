// ============= Reward Engine Constants v3.0 — Guilty-Free Time =============

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

// Gauge: absolute cap at 200 minutes
export const GAUGE_MAX_MINUTES = 200;

// Fixed reward tiers (minutes)
export const TIME_TIERS = [30, 60, 90, 120, 150, 180] as const;

// Compensation bonus: +10 min for every 60 min tranche earned
export const COMPENSATION_THRESHOLD = 60;
export const COMPENSATION_BONUS = 10;

// Skill level thresholds (generic, still used by engine.ts)
export const SKILL_LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500] as const;

// ---- Per-skill level thresholds ----

// Planification: niveaux basés sur le nombre de tâches structurées (≥2 sous-tâches)
export const PLANIF_LEVEL_THRESHOLDS = [0, 20, 50, 100] as const;

// Priorisation: seuil Q2 % sur 60 jours pour monter de niveau
export const PRIO_LEVEL_Q2_THRESHOLD = 40;

// Discipline: niveaux basés sur le nombre de jours actifs
export const DISCIPLINE_LEVEL_DAYS = [0, 30, 60, 90] as const;

// Vision long terme: seuil % de tâches complétées appartenant à des projets
export const VISION_LEVEL_PCT_IN_PROJECT = 50;

// Résilience: seuil % de tâches anciennes terminées
export const RESILIENCE_LEVEL_PCT_ANCIENT = 25;

// Priorité interne projet (subCategory XP)
export const PROJECT_PRIORITY_XP: Record<string, number> = {
  'Le plus important': 5,
  'Important': 3,
  'Peut attendre': 1,
  "Si j'ai le temps": 0,
};

// Decay constants for unrefined minutes
export const DECAY_RATE_PER_WEEK = 0.10;
export const MAX_DECAY_WEEKS = 10;

// Anti-spam: no XP if task completed < 15 min after creation
export const ANTI_SPAM_MINUTES = 15;

// Resilience multi-level bonuses (additive XP based on task age)
export const RESILIENCE_BONUS_3D = 5;
export const RESILIENCE_BONUS_7D = 10;
export const RESILIENCE_BONUS_14D = 20;

// Kanban change bonus
export const KANBAN_CHANGE_BONUS = 15;
export const KANBAN_MIN_CHANGES = 2;

// Project vision bonuses
export const PROJECT_TASK_BONUS = 5;
export const PROJECT_COMPLETED_BONUS = 15;
export const PROJECT_ACTIVE_60D_BONUS = 10;
export const PROJECT_ACTIVE_90D_BONUS = 20;

// Cognitive load thresholds (observatory alerts, no XP penalty)
export const COGNITIVE_LOAD_OPEN_TASKS_THRESHOLD = 50;
export const COGNITIVE_LOAD_RATIO_THRESHOLD = 3;
export const COGNITIVE_LOAD_ACTIVE_PROJECTS_THRESHOLD = 5;

// Subtask structural limits
export const MAX_SUBTASK_DEPTH = 2;
export const MAX_CHILDREN_PER_TASK = 3;
