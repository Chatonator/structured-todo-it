// ============= Skills Engine v3.0 — Aligned with real app behaviour =============
// 5 skills measuring real behaviours, not volume

import { computeSkillLevel } from './engine';
import {
  PLANIF_LEVEL_THRESHOLDS,
  PRIO_LEVEL_Q2_THRESHOLD,
  DISCIPLINE_LEVEL_DAYS,
  VISION_LEVEL_PCT_IN_PROJECT,
  RESILIENCE_LEVEL_PCT_ANCIENT,
  PROJECT_PRIORITY_XP,
  RESILIENCE_BONUS_3D,
  RESILIENCE_BONUS_7D,
  RESILIENCE_BONUS_14D,
  KANBAN_CHANGE_BONUS,
  KANBAN_MIN_CHANGES,
  PROJECT_TASK_BONUS,
  PROJECT_ACTIVE_60D_BONUS,
  PROJECT_ACTIVE_90D_BONUS,
} from './constants';
import type { SkillData } from '@/types/gamification';
import { differenceInDays } from 'date-fns';

export interface RawSkillItem {
  id: string;
  parent_id?: string | null;
  is_completed: boolean;
  is_important: boolean;
  is_urgent: boolean;
  created_at: string;
  updated_at?: string | null;
  project_id?: string | null;
  postpone_count: number;
  metadata?: any;
  sub_category?: string | null;   // priorité interne projet
  project_status?: string | null; // statut Kanban (to-do, doing, done)
}

// ---- Helpers ----

function getChildren(items: RawSkillItem[], parentId: string): RawSkillItem[] {
  return items.filter(i => i.parent_id === parentId);
}

function computeThresholdLevel(value: number, thresholds: readonly number[]): { level: number; progressPct: number; xpForNext: number } {
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (value >= thresholds[i]) {
      level = i + 1;
      break;
    }
  }
  const current = thresholds[level - 1] ?? 0;
  const next = thresholds[level] ?? current + Math.max(current, 50);
  const range = next - current;
  const progressPct = range > 0 ? Math.min(100, Math.round(((value - current) / range) * 100)) : 100;
  return { level, progressPct, xpForNext: next };
}

// ---- 1. Planification ----
function computePlanificationXP(items: RawSkillItem[]): { xp: number; structuredCount: number; completionRate: number } {
  // Only consider root tasks (no parent)
  const roots = items.filter(i => !i.parent_id);
  let xp = 0;
  let structuredCount = 0;

  for (const root of roots) {
    const children = getChildren(items, root.id);
    if (children.length < 2) continue;

    // ≥2 sous-tâches
    structuredCount++;
    xp += children.length >= 3 ? 8 : 5;

    // Toutes sous-tâches complétées
    if (children.every(c => c.is_completed)) {
      xp += 5;
    }

    // Bonus léger: une sous-tâche a ≥2 sous-sous-tâches
    for (const child of children) {
      const grandchildren = getChildren(items, child.id);
      if (grandchildren.length >= 2) {
        xp += 3;
        break; // bonus une seule fois par root
      }
    }
  }

  const totalRoots = roots.filter(r => r.is_completed).length;
  const completionRate = totalRoots > 0 && structuredCount > 0
    ? Math.round((roots.filter(r => r.is_completed && getChildren(items, r.id).length >= 2 && getChildren(items, r.id).every(c => c.is_completed)).length / structuredCount) * 100)
    : 0;

  return { xp, structuredCount, completionRate };
}

// ---- 2. Priorisation ----
function computePriorisationXP(items: RawSkillItem[]): { xp: number; pctQ2_30: number; pctQ2_60: number; pctQ2_90: number } {
  const now = Date.now();
  const cutoff30 = now - 30 * 86400000;
  const cutoff60 = now - 60 * 86400000;
  const cutoff90 = now - 90 * 86400000;

  const completed = items.filter(i => i.is_completed);
  let xp = 0;

  let q2_30 = 0, total_30 = 0;
  let q2_60 = 0, total_60 = 0;
  let q2_90 = 0, total_90 = 0;

  // A) Tâches classiques (sans projet) — Eisenhower
  const classicCompleted = completed.filter(i => !i.project_id);
  for (const item of classicCompleted) {
    const isQ2 = item.is_important && !item.is_urgent;
    const isQ1 = item.is_important && item.is_urgent;
    if (isQ2) xp += 5;
    else if (isQ1) xp += 3;

    const createdMs = new Date(item.created_at).getTime();
    if (createdMs >= cutoff30) { total_30++; if (isQ2) q2_30++; }
    if (createdMs >= cutoff60) { total_60++; if (isQ2) q2_60++; }
    if (createdMs >= cutoff90) { total_90++; if (isQ2) q2_90++; }
  }

  // Malus Q1 >70% sur 30 jours (classiques uniquement)
  if (total_30 > 0) {
    const q1_30 = classicCompleted.filter(i => i.is_important && i.is_urgent && new Date(i.created_at).getTime() >= cutoff30).length;
    if (q1_30 / total_30 > 0.7) {
      const excess = q1_30 - Math.floor(total_30 * 0.7);
      xp = Math.max(0, xp - excess);
    }
  }

  // B) Tâches projet — priorité interne (subCategory)
  const projectCompleted = completed.filter(i => !!i.project_id);
  for (const item of projectCompleted) {
    const sc = item.sub_category || '';
    xp += PROJECT_PRIORITY_XP[sc] ?? 1;
  }

  // Malus projet: >50% "Si j'ai le temps" complétées sur 30j alors que priorités hautes ouvertes
  const projectCompleted30 = projectCompleted.filter(i => new Date(i.created_at).getTime() >= cutoff30);
  if (projectCompleted30.length > 0) {
    const lowCount = projectCompleted30.filter(i => i.sub_category === "Si j'ai le temps").length;
    const hasHighOpen = items.some(i => !!i.project_id && !i.is_completed && (i.sub_category === 'Le plus important' || i.sub_category === 'Important'));
    if (lowCount / projectCompleted30.length > 0.5 && hasHighOpen) {
      xp = Math.max(0, xp - 2 * lowCount);
    }
  }

  const pctQ2_30 = total_30 > 0 ? Math.round((q2_30 / total_30) * 100) : 0;
  const pctQ2_60 = total_60 > 0 ? Math.round((q2_60 / total_60) * 100) : 0;
  const pctQ2_90 = total_90 > 0 ? Math.round((q2_90 / total_90) * 100) : 0;

  return { xp, pctQ2_30, pctQ2_60, pctQ2_90 };
}

// ---- 3. Discipline ----
function computeDisciplineXP(
  currentStreak: number,
  habitWeeklyRate: number,
  completedTaskCount: number,
  activeDaysCount: number,
): { xp: number; activeDays: number } {
  let xp = 0;

  // +1 XP par tâche complétée
  xp += completedTaskCount;

  // +20 XP par bloc de 7 jours consécutifs
  xp += Math.floor(currentStreak / 7) * 20;

  // +10 XP habitudes ≥80%
  if (habitWeeklyRate >= 0.8) xp += 10;

  return { xp, activeDays: activeDaysCount };
}

// ---- 4. Vision Long Terme ----
function computeVisionXP(
  items: RawSkillItem[],
  completedProjectCount: number,
  projectTaskCounts: Map<string, { total: number; completed: number }>,
  projectAges?: Map<string, number>,
  projectWeeklyActivity?: Map<string, boolean>,
): { xp: number; pctInProject: number } {
  const completedTasks = items.filter(i => i.is_completed);
  const inProject = completedTasks.filter(i => i.project_id);

  let xp = completedProjectCount * 15;

  // +5 XP per project task completed
  xp += inProject.length * PROJECT_TASK_BONUS;

  // +5 XP si ≥70% des tâches d'un projet sont complétées
  for (const [, counts] of projectTaskCounts) {
    if (counts.total > 0 && (counts.completed / counts.total) >= 0.7) {
      xp += 5;
    }
  }

  // Project duration bonuses
  if (projectAges) {
    for (const [projectId, ageInDays] of projectAges) {
      const hasWeekly = projectWeeklyActivity?.get(projectId) ?? false;
      if (ageInDays >= 90 && hasWeekly) {
        xp += PROJECT_ACTIVE_90D_BONUS;
      } else if (ageInDays >= 60) {
        xp += PROJECT_ACTIVE_60D_BONUS;
      }
    }
  }

  const pctInProject = completedTasks.length > 0 ? Math.round((inProject.length / completedTasks.length) * 100) : 0;
  return { xp, pctInProject };
}

// ---- 5. Résilience ----
function computeResilienceXP(items: RawSkillItem[]): { xp: number; recoveryRate: number; ancientCount: number; ancient7dCount: number } {
  const completed = items.filter(i => i.is_completed);
  let xp = 0;
  let ancientCount = 0;
  let ancient7dCount = 0;

  for (const item of completed) {
    const createdAt = new Date(item.created_at);
    const updatedAt = item.updated_at ? new Date(item.updated_at) : createdAt;
    const age = differenceInDays(updatedAt, createdAt);

    // Multi-level resilience bonuses
    if (age >= 14) {
      xp += RESILIENCE_BONUS_14D;
      ancientCount++;
      ancient7dCount++;
    } else if (age >= 7) {
      xp += RESILIENCE_BONUS_7D;
      ancientCount++;
      ancient7dCount++;
    } else if (age >= 3) {
      xp += RESILIENCE_BONUS_3D;
      ancientCount++;
    }

    // Bonus Kanban: tâche passée par des colonnes avant complétion
    // Use postpone_count as proxy for column changes
    if (item.postpone_count >= KANBAN_MIN_CHANGES) {
      xp += KANBAN_CHANGE_BONUS;
    }
  }

  const recoveryRate = completed.length > 0 ? Math.round((ancientCount / completed.length) * 100) : 0;
  return { xp, recoveryRate, ancientCount, ancient7dCount };
}

// ---- Main export ----

export interface SkillsEngineInput {
  items: RawSkillItem[];
  currentStreak: number;
  habitWeeklyRate: number;
  completedProjectCount: number;
  totalProjectCount: number;
  activeDaysCount: number;
  projectTaskCounts: Map<string, { total: number; completed: number }>;
  projectAges?: Map<string, number>;
  projectWeeklyActivity?: Map<string, boolean>;
}

export interface SkillsEngineResult {
  skills: SkillData[];
  maturityIndices: {
    structuration: number;   // % tâches structurées complétées
    strategique: number;     // % Q2 sur 60j
    constance: number;       // jours actifs
    longTerme: number;       // % tâches en projet
    resilience: number;      // % tâches anciennes terminées
  };
}

export function computeAllSkills(input: SkillsEngineInput): SkillsEngineResult {
  const { items, currentStreak, habitWeeklyRate, completedProjectCount, totalProjectCount, activeDaysCount, projectTaskCounts, projectAges, projectWeeklyActivity } = input;

  const completedTaskCount = items.filter(i => i.is_completed).length;

  const planif = computePlanificationXP(items);
  const prio = computePriorisationXP(items);
  const disc = computeDisciplineXP(currentStreak, habitWeeklyRate, completedTaskCount, activeDaysCount);
  const vision = computeVisionXP(items, completedProjectCount, projectTaskCounts, projectAges, projectWeeklyActivity);
  const resil = computeResilienceXP(items);

  const planifLevel = computeThresholdLevel(planif.structuredCount, PLANIF_LEVEL_THRESHOLDS);
  const prioLevel = computeSkillLevel(prio.xp);
  const discLevel = computeThresholdLevel(activeDaysCount, DISCIPLINE_LEVEL_DAYS);
  const visionLevel = computeSkillLevel(vision.xp);
  const resilLevel = computeSkillLevel(resil.xp);

  const skills: SkillData[] = [
    {
      key: 'planification',
      name: 'Planification',
      icon: '🗂️',
      xp: planif.xp,
      level: planifLevel.level,
      progressPct: planifLevel.progressPct,
      xpForNext: planifLevel.xpForNext,
      indicator: `${planif.structuredCount} tâches structurées`,
    },
    {
      key: 'priorisation',
      name: 'Priorisation',
      icon: '⭐',
      xp: prio.xp,
      level: prioLevel.level,
      progressPct: prioLevel.progressPct,
      xpForNext: prioLevel.xpForNext,
      indicator: `Q2 : ${prio.pctQ2_60}% / 60j`,
    },
    {
      key: 'discipline',
      name: 'Discipline',
      icon: '🔥',
      xp: disc.xp,
      level: discLevel.level,
      progressPct: discLevel.progressPct,
      xpForNext: discLevel.xpForNext,
      indicator: `${activeDaysCount} jours actifs`,
    },
    {
      key: 'vision',
      name: 'Vision long terme',
      icon: '🚀',
      xp: vision.xp,
      level: visionLevel.level,
      progressPct: visionLevel.progressPct,
      xpForNext: visionLevel.xpForNext,
      indicator: `${vision.pctInProject}% en projet`,
    },
    {
      key: 'resilience',
      name: 'Résilience',
      icon: '💪',
      xp: resil.xp,
      level: resilLevel.level,
      progressPct: resilLevel.progressPct,
      xpForNext: resilLevel.xpForNext,
      indicator: `Récupération ${resil.recoveryRate}%`,
    },
  ];

  return {
    skills,
    maturityIndices: {
      structuration: planif.completionRate,
      strategique: prio.pctQ2_60,
      constance: activeDaysCount,
      longTerme: vision.pctInProject,
      resilience: resil.recoveryRate,
    },
  };
}
