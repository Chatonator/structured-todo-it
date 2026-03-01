import { Task, TaskCategory } from '@/types/task';
import { 
  differenceInDays, startOfWeek, endOfWeek, subWeeks, 
  isWithinInterval, format, subDays, startOfDay 
} from 'date-fns';
import { formatAge } from '@/lib/formatters';
import { 
  EnrichedTask, InsightsData, ChartsData, HeatmapDay, 
  TrendPoint, CategoryStat, ActivityItem, TaskGroup 
} from './useObservatoryViewData';

/** Enrich raw tasks with computed metadata */
export function enrichTasks(
  tasks: Task[], 
  projectLookup: Map<string, string>
): EnrichedTask[] {
  const now = new Date();
  return tasks.map(task => {
    const createdAt = task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt);
    const age = differenceInDays(now, createdAt);
    const isZombie = !task.isCompleted && age > 7;
    return {
      ...task,
      age,
      ageLabel: formatAge(createdAt),
      isZombie,
      projectName: task.projectId ? projectLookup.get(task.projectId) : undefined,
    };
  });
}

/** Calculate productivity insights */
export function calculateInsights(enrichedTasks: EnrichedTask[]): InsightsData {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const zombieTasks = enrichedTasks.filter(t => t.isZombie);
  
  const completedThisWeek = enrichedTasks.filter(t => 
    t.isCompleted && t.createdAt instanceof Date && 
    isWithinInterval(t.createdAt, { start: thisWeekStart, end: thisWeekEnd })
  ).length;
  
  const completedLastWeek = enrichedTasks.filter(t => 
    t.isCompleted && t.createdAt instanceof Date && 
    isWithinInterval(t.createdAt, { start: lastWeekStart, end: lastWeekEnd })
  ).length;

  const velocityChange = completedLastWeek > 0 
    ? Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100)
    : completedThisWeek > 0 ? 100 : 0;

  const timeRecovered = enrichedTasks
    .filter(t => t.isCompleted)
    .reduce((sum, t) => sum + t.estimatedTime, 0);

  const createdThisWeek = enrichedTasks.filter(t => {
    const createdAt = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
    return isWithinInterval(createdAt, { start: thisWeekStart, end: thisWeekEnd });
  }).length;

  const healthRatio = createdThisWeek > 0 
    ? Math.round((completedThisWeek / createdThisWeek) * 100) 
    : completedThisWeek > 0 ? 100 : 0;

  return {
    zombieTasks, velocityThisWeek: completedThisWeek, velocityLastWeek: completedLastWeek,
    velocityChange, timeRecovered, createdThisWeek, completedThisWeek, healthRatio,
  };
}

/** Calculate chart data (heatmap, trends, categories) */
export function calculateCharts(enrichedTasks: EnrichedTask[]): ChartsData {
  const now = new Date();
  
  const creationHeatmap: HeatmapDay[] = [];
  for (let i = 34; i >= 0; i--) {
    const date = startOfDay(subDays(now, i));
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = enrichedTasks.filter(t => {
      const createdAt = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
      return format(startOfDay(createdAt), 'yyyy-MM-dd') === dateStr;
    }).length;
    creationHeatmap.push({ date: dateStr, count });
  }

  const completionTrend: TrendPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = startOfDay(subDays(now, i));
    const dateStr = format(date, 'yyyy-MM-dd');
    const label = format(date, 'dd/MM');
    
    const completed = enrichedTasks.filter(t => {
      if (!t.isCompleted) return false;
      const createdAt = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
      return format(startOfDay(createdAt), 'yyyy-MM-dd') === dateStr;
    }).length;
    
    const created = enrichedTasks.filter(t => {
      const createdAt = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
      return format(startOfDay(createdAt), 'yyyy-MM-dd') === dateStr;
    }).length;
    
    completionTrend.push({ date: dateStr, label, completed, created });
  }

  const activeTasks = enrichedTasks.filter(t => !t.isCompleted);
  const categories: TaskCategory[] = ['Obligation', 'Quotidien', 'Envie', 'Autres'];
  const categoryBreakdown: CategoryStat[] = categories.map(category => {
    const count = activeTasks.filter(t => t.category === category).length;
    return {
      category, count,
      percentage: activeTasks.length > 0 ? Math.round((count / activeTasks.length) * 100) : 0,
    };
  });

  return { creationHeatmap, completionTrend, categoryBreakdown };
}

/** Group tasks by project then category */
export function groupTasks(
  sortedTasks: EnrichedTask[], 
  projectLookup: Map<string, string>
): TaskGroup[] {
  const projectGroups = new Map<string, EnrichedTask[]>();
  const categories: TaskCategory[] = ['Obligation', 'Quotidien', 'Envie', 'Autres'];
  
  sortedTasks.forEach(task => {
    const key = task.projectId || 'no-project';
    if (!projectGroups.has(key)) projectGroups.set(key, []);
    projectGroups.get(key)!.push(task);
  });

  const sortedKeys = Array.from(projectGroups.keys()).sort((a, b) => {
    if (a === 'no-project') return 1;
    if (b === 'no-project') return -1;
    return (projectLookup.get(a) || '').localeCompare(projectLookup.get(b) || '');
  });

  return sortedKeys.map(projectKey => {
    const tasks = projectGroups.get(projectKey)!;
    const projectName = projectKey === 'no-project' 
      ? 'Sans projet' 
      : projectLookup.get(projectKey) || 'Projet inconnu';

    const subGroups: TaskGroup[] = categories
      .map(category => {
        const categoryTasks = tasks.filter(t => t.category === category);
        if (categoryTasks.length === 0) return null;
        return {
          id: `${projectKey}-${category}`,
          name: category as string,
          tasks: categoryTasks,
          totalTime: categoryTasks.reduce((sum, t) => sum + t.estimatedTime, 0),
          completedCount: categoryTasks.filter(t => t.isCompleted).length,
        } as TaskGroup;
      })
      .filter((g): g is TaskGroup => g !== null);

    return {
      id: projectKey,
      name: projectName,
      tasks,
      totalTime: tasks.reduce((sum, t) => sum + t.estimatedTime, 0),
      completedCount: tasks.filter(t => t.isCompleted).length,
      subGroups,
    };
  });
}

// ---- Maturity Indices ----

export interface MaturityIndices {
  structuration: number;
  strategique: number;
  constance: number;
  longTerme: number;
  resilience: number;
}

export interface GlobalMaturityScore {
  score: number;
  isBalanced: boolean;
  highLevelSkillCount: number;
  alerts: string[];
}

export function computeGlobalMaturityScore(indices: MaturityIndices): GlobalMaturityScore {
  // Normalize constance to 0-100 (cap at 90 days)
  const normalizedConstance = Math.min(100, Math.round((indices.constance / 90) * 100));
  
  const values = [
    indices.structuration,
    indices.strategique,
    normalizedConstance,
    indices.longTerme,
    indices.resilience,
  ];
  
  const score = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  const isBalanced = values.every(v => v >= 30);
  
  // Count skills >= level 3 (approximated: >= 60%)
  const highLevelSkillCount = values.filter(v => v >= 60).length;
  
  const alerts: string[] = [];
  if (!isBalanced) {
    const labels = ['Structuration', 'Stratégique', 'Constance', 'Long terme', 'Résilience'];
    values.forEach((v, i) => {
      if (v < 30) alerts.push(`${labels[i]} est sous le seuil (${v}%)`);
    });
  }
  if (highLevelSkillCount < 2) {
    alerts.push('Moins de 2 compétences au niveau avancé');
  }
  
  return { score, isBalanced, highLevelSkillCount, alerts };
}

export interface CognitiveLoadResult {
  openTaskCount: number;
  completedTaskCount: number;
  openCompletedRatio: number;
  activeProjectCount: number;
  isOverloaded: boolean;
  suggestions: string[];
}

export function computeCognitiveLoad(
  tasks: EnrichedTask[],
  activeProjectCount: number
): CognitiveLoadResult {
  const openTaskCount = tasks.filter(t => !t.isCompleted).length;
  const completedTaskCount = tasks.filter(t => t.isCompleted).length;
  const openCompletedRatio = completedTaskCount > 0 ? openTaskCount / completedTaskCount : openTaskCount;
  
  const suggestions: string[] = [];
  let isOverloaded = false;
  
  if (openTaskCount > 50) {
    isOverloaded = true;
    suggestions.push('Archiver les tâches inactives depuis plus de 30 jours');
  }
  if (openCompletedRatio > 3) {
    isOverloaded = true;
    suggestions.push('Regrouper les tâches isolées en projet');
  }
  if (activeProjectCount > 5) {
    isOverloaded = true;
    suggestions.push('Clôturer les projets inactifs');
  }
  
  return { openTaskCount, completedTaskCount, openCompletedRatio, activeProjectCount, isOverloaded, suggestions };
}

export function calculateMaturityIndices(enrichedTasks: EnrichedTask[]): MaturityIndices {
  const now = Date.now();
  const completed = enrichedTasks.filter(t => t.isCompleted);

  // Structuration: % of structured roots fully completed
  const childIds = new Set(enrichedTasks.map(t => t.parentId).filter(Boolean));
  const parents = enrichedTasks.filter(t => childIds.has(t.id));
  const structuredCompleted = parents.filter(t => t.isCompleted).length;
  const structuration = parents.length > 0 ? Math.round((structuredCompleted / parents.length) * 100) : 0;

  // Strategique: Q2 % over 60 days
  const c60 = completed.filter(t => (now - new Date(t.createdAt).getTime()) <= 60 * 86400000);
  const q2_60 = c60.filter(t => t.isImportant && !t.isUrgent).length;
  const strategique = c60.length > 0 ? Math.round((q2_60 / c60.length) * 100) : 0;

  // Constance: unique active days (simplified from completions)
  const activeDays = new Set(completed.map(t => {
    const d = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
    return d.toISOString().split('T')[0];
  }));
  const constance = activeDays.size;

  // Long terme: % tasks in project
  const inProject = completed.filter(t => !!t.projectId);
  const longTerme = completed.length > 0 ? Math.round((inProject.length / completed.length) * 100) : 0;

  // Resilience: % ancient completed (≥ 7 days for level-up threshold)
  const ancient = completed.filter(t => {
    const age = (now - new Date(t.createdAt).getTime()) / 86400000;
    return age >= 7;
  });
  const resilience = completed.length > 0 ? Math.round((ancient.length / completed.length) * 100) : 0;

  return { structuration, strategique, constance, longTerme, resilience };
}

/** Generate recent activity from tasks */
export function buildRecentActivity(enrichedTasks: EnrichedTask[]): ActivityItem[] {
  return enrichedTasks
    .slice(0, 20)
    .map(task => ({
      id: `activity-${task.id}`,
      type: task.isCompleted ? 'completed' as const : 'created' as const,
      taskName: task.name,
      taskId: task.id,
      timestamp: task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt),
    }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
