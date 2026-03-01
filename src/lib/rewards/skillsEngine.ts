// ============= Skills Engine v2.0 — Organisational Maturity =============
// 5 skills measuring real behaviours, not volume

import { computeSkillLevel } from './engine';
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
}

export interface SkillItemWithChildren extends RawSkillItem {
  children?: SkillItemWithChildren[];
}

// ---- Helpers ----

/** Compute depth of a task tree (1 = only root, 2 = root + children, etc.) */
function computeDepth(node: SkillItemWithChildren): number {
  if (!node.children || node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(computeDepth));
}

/** Get all child items for a given parent id */
function getChildren(items: RawSkillItem[], parentId: string): RawSkillItem[] {
  return items.filter(i => i.parent_id === parentId);
}

/** Build tree for root-level tasks */
function buildTree(items: RawSkillItem[]): SkillItemWithChildren[] {
  const itemMap = new Map<string, SkillItemWithChildren>(
    items.map(i => [i.id, { ...i, children: [] }])
  );
  const roots: SkillItemWithChildren[] = [];
  for (const item of itemMap.values()) {
    if (!item.parent_id) {
      roots.push(item);
    } else {
      const parent = itemMap.get(item.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(item);
      } else {
        // orphan treated as root
        roots.push(item);
      }
    }
  }
  return roots;
}

// ---- 1. Planification ----
function computePlanificationXP(items: RawSkillItem[]): { xp: number; avgDepth: number; structuredCompleted: number } {
  const trees = buildTree(items);
  let xp = 0;
  let totalDepthForTrees = 0;
  let treesWithChildren = 0;
  let structuredCompleted = 0;

  for (const root of trees) {
    const directChildren = root.children || [];
    const depth = computeDepth(root);

    if (directChildren.length >= 3) xp += 5; // ≥3 sub-tasks
    if (depth >= 2) {
      xp += 10; // 2-level hierarchy
      treesWithChildren++;
      totalDepthForTrees += depth;
    }

    // Structured task: root has children and all children are completed
    const allChildrenCompleted = directChildren.length > 0 && directChildren.every(c => c.is_completed);
    if (allChildrenCompleted && root.is_completed) {
      xp += 25;
      structuredCompleted++;
    }
  }

  const avgDepth = treesWithChildren > 0 ? Math.round((totalDepthForTrees / treesWithChildren) * 10) / 10 : 1;
  return { xp, avgDepth, structuredCompleted };
}

// ---- 2. Priorisation Stratégique ----
function computePriorisationXP(
  items: RawSkillItem[],
  daysWindow: number = 30
): { xp: number; pctQ2_30: number; pctQ2_60: number; pctQ2_90: number } {
  const now = Date.now();
  const cutoff30 = now - 30 * 86400000;
  const cutoff60 = now - 60 * 86400000;
  const cutoff90 = now - 90 * 86400000;

  const completed = items.filter(i => i.is_completed);
  let xp = 0;

  let q2Total = 0, q1Total = 0, total = 0;
  let q2_30 = 0, total_30 = 0;
  let q2_60 = 0, total_60 = 0;
  let q2_90 = 0, total_90 = 0;

  for (const item of completed) {
    const isQ2 = item.is_important && !item.is_urgent;
    const isQ1 = item.is_important && item.is_urgent;
    if (isQ2) { xp += 5; q2Total++; }
    if (isQ1) { xp += 3; q1Total++; }
    total++;

    const createdMs = new Date(item.created_at).getTime();
    if (createdMs >= cutoff30) {
      total_30++;
      if (isQ2) q2_30++;
    }
    if (createdMs >= cutoff60) {
      total_60++;
      if (isQ2) q2_60++;
    }
    if (createdMs >= cutoff90) {
      total_90++;
      if (isQ2) q2_90++;
    }
  }

  // Malus: if >70% tasks Q1 in last 30 days (floored at 0)
  if (total_30 > 0) {
    const q1count = items.filter(i => i.is_completed && i.is_important && i.is_urgent && new Date(i.created_at).getTime() >= cutoff30).length;
    const q1Pct = q1count / total_30;
    if (q1Pct > 0.7) {
      const excess = q1count - Math.floor(total_30 * 0.7);
      xp = Math.max(0, xp - excess);
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
  habitWeeklyRate: number // 0-1
): { xp: number } {
  let xp = 0;

  // Streak bonus: +20 XP per 7-day block
  const weekBlocks = Math.floor(currentStreak / 7);
  xp += weekBlocks * 20;

  // Habit completion bonus: if ≥80% this week, +10 XP
  if (habitWeeklyRate >= 0.8) xp += 10;

  return { xp };
}

// ---- 4. Vision Long Terme ----
function computeVisionXP(
  items: RawSkillItem[],
  completedProjectCount: number
): { xp: number; pctInProject: number; pctProjectCompleted: number } {
  const tasks = items.filter(i => i.is_completed);
  const inProject = tasks.filter(i => i.project_id);

  let xp = completedProjectCount * 15;

  // +5 XP per Q2 task in a project
  const projectQ2 = inProject.filter(i => i.is_important && !i.is_urgent);
  xp += projectQ2.length * 5;

  const pctInProject = tasks.length > 0 ? Math.round((inProject.length / tasks.length) * 100) : 0;

  return { xp, pctInProject, pctProjectCompleted: 0 }; // pctProjectCompleted computed externally
}

// ---- 5. Résilience ----
function computeResilienceXP(
  items: RawSkillItem[]
): { xp: number; recoveryRate: number } {
  const completed = items.filter(i => i.is_completed);
  const totalCompleted = completed.length;
  let ancientCompleted = 0;
  let xp = 0;

  for (const item of completed) {
    const createdAt = new Date(item.created_at);
    const updatedAt = item.updated_at ? new Date(item.updated_at) : createdAt;
    const age = differenceInDays(updatedAt, createdAt);

    if (age >= 3) {
      xp += 10;
      ancientCompleted++;
    }

    // Extra bonus: postponed AND ancient
    if (age >= 3 && item.postpone_count >= 2) {
      xp += 15;
    }
  }

  const recoveryRate = totalCompleted > 0 ? Math.round((ancientCompleted / totalCompleted) * 100) : 0;
  return { xp, recoveryRate };
}

// ---- Main export ----

export interface SkillsEngineInput {
  items: RawSkillItem[];
  currentStreak: number;
  habitWeeklyRate: number;
  completedProjectCount: number;
  totalProjectCount: number;
}

export interface SkillsEngineResult {
  skills: SkillData[];
  maturityIndices: {
    avgDepth: number;
    structuredCompleted: number;
    pctQ2: { d30: number; d60: number; d90: number };
    recoveryRate: number;
    pctInProject: number;
  };
}

export function computeAllSkills(input: SkillsEngineInput): SkillsEngineResult {
  const { items, currentStreak, habitWeeklyRate, completedProjectCount, totalProjectCount } = input;

  const planif = computePlanificationXP(items);
  const prio = computePriorisationXP(items);
  const disc = computeDisciplineXP(currentStreak, habitWeeklyRate);
  const vision = computeVisionXP(items, completedProjectCount);
  const resil = computeResilienceXP(items);

  const defs = [
    {
      key: 'planification',
      name: 'Planification',
      icon: '🗂️',
      xp: planif.xp,
      indicator: `Profondeur moy. ${planif.avgDepth}`,
    },
    {
      key: 'priorisation',
      name: 'Priorisation',
      icon: '⭐',
      xp: prio.xp,
      indicator: `Q2 : ${prio.pctQ2_30}% / 30j`,
    },
    {
      key: 'discipline',
      name: 'Discipline',
      icon: '🔥',
      xp: disc.xp,
      indicator: `Série : ${currentStreak}j`,
    },
    {
      key: 'vision',
      name: 'Vision long terme',
      icon: '🚀',
      xp: vision.xp,
      indicator: `${vision.pctInProject}% en projet`,
    },
    {
      key: 'resilience',
      name: 'Résilience',
      icon: '💪',
      xp: resil.xp,
      indicator: `Récupération ${resil.recoveryRate}%`,
    },
  ];

  const skills: SkillData[] = defs.map(s => {
    const { level, progressPct, xpForNext } = computeSkillLevel(s.xp);
    return {
      key: s.key,
      name: s.name,
      icon: s.icon,
      xp: s.xp,
      level,
      progressPct,
      xpForNext,
      indicator: s.indicator,
    };
  });

  const pctProjectCompleted = totalProjectCount > 0
    ? Math.round((completedProjectCount / totalProjectCount) * 100)
    : 0;

  return {
    skills,
    maturityIndices: {
      avgDepth: planif.avgDepth,
      structuredCompleted: planif.structuredCompleted,
      pctQ2: { d30: prio.pctQ2_30, d60: prio.pctQ2_60, d90: prio.pctQ2_90 },
      recoveryRate: resil.recoveryRate,
      pctInProject: vision.pctInProject,
    },
  };
}
