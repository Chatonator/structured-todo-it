import { useMemo, useState, useCallback } from 'react';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { Task, TaskCategory } from '@/types/task';
import { useProjects } from '@/hooks/useProjects';
import { 
  differenceInDays, 
  startOfWeek, 
  endOfWeek, 
  subWeeks, 
  isWithinInterval, 
  format, 
  subDays,
  startOfDay 
} from 'date-fns';
import { formatAge } from '@/lib/formatters';

// ============= Types =============
export type TabFilter = 'active' | 'completed' | 'zombie' | 'recent';
export type SortField = 'name' | 'category' | 'context' | 'age' | 'estimatedTime' | 'project' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface TrendPoint {
  date: string;
  label: string;
  completed: number;
  created: number;
}

export interface CategoryStat {
  category: TaskCategory;
  count: number;
  percentage: number;
}

export interface ActivityItem {
  id: string;
  type: 'created' | 'completed' | 'restored';
  taskName: string;
  taskId: string;
  timestamp: Date;
}

export interface EnrichedTask extends Task {
  age: number;
  ageLabel: string;
  isZombie: boolean;
  projectName?: string;
}

export interface InsightsData {
  zombieTasks: EnrichedTask[];
  velocityThisWeek: number;
  velocityLastWeek: number;
  velocityChange: number;
  timeRecovered: number;
  createdThisWeek: number;
  completedThisWeek: number;
  healthRatio: number;
}

export interface ChartsData {
  creationHeatmap: HeatmapDay[];
  completionTrend: TrendPoint[];
  categoryBreakdown: CategoryStat[];
}

// ============= Hook =============
export const useObservatoryViewData = () => {
  const viewData = useViewDataContext();
  const { projects } = useProjects();
  
  // State
  const [activeTab, setActiveTab] = useState<TabFilter>('active');
  const [sortField, setSortField] = useState<SortField>('age');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  // Create project lookup
  const projectLookup = useMemo(() => {
    return new Map(projects.map(p => [p.id, p.name]));
  }, [projects]);

  // Enrich tasks with metadata
  const enrichedTasks = useMemo((): EnrichedTask[] => {
    const now = new Date();
    
    return viewData.tasks.map(task => {
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
  }, [viewData.tasks, projectLookup]);

  // Calculate insights
  const insights = useMemo((): InsightsData => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const zombieTasks = enrichedTasks.filter(t => t.isZombie);
    
    // Tasks completed this week vs last week
    const completedThisWeek = enrichedTasks.filter(t => 
      t.isCompleted && 
      t.createdAt instanceof Date && 
      isWithinInterval(t.createdAt, { start: thisWeekStart, end: thisWeekEnd })
    ).length;
    
    const completedLastWeek = enrichedTasks.filter(t => 
      t.isCompleted && 
      t.createdAt instanceof Date && 
      isWithinInterval(t.createdAt, { start: lastWeekStart, end: lastWeekEnd })
    ).length;

    const velocityChange = completedLastWeek > 0 
      ? Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100)
      : completedThisWeek > 0 ? 100 : 0;

    // Time recovered (sum of completed task times)
    const timeRecovered = enrichedTasks
      .filter(t => t.isCompleted)
      .reduce((sum, t) => sum + t.estimatedTime, 0);

    // Created this week
    const createdThisWeek = enrichedTasks.filter(t => {
      const createdAt = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
      return isWithinInterval(createdAt, { start: thisWeekStart, end: thisWeekEnd });
    }).length;

    // Health ratio (completed / created)
    const healthRatio = createdThisWeek > 0 
      ? Math.round((completedThisWeek / createdThisWeek) * 100) 
      : completedThisWeek > 0 ? 100 : 0;

    return {
      zombieTasks,
      velocityThisWeek: completedThisWeek,
      velocityLastWeek: completedLastWeek,
      velocityChange,
      timeRecovered,
      createdThisWeek,
      completedThisWeek,
      healthRatio,
    };
  }, [enrichedTasks]);

  // Calculate charts data
  const charts = useMemo((): ChartsData => {
    const now = new Date();
    
    // Heatmap: last 35 days (5 weeks)
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

    // Trend: last 14 days
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

    // Category breakdown (active tasks only)
    const activeTasks = enrichedTasks.filter(t => !t.isCompleted);
    const categories: TaskCategory[] = ['Obligation', 'Quotidien', 'Envie', 'Autres'];
    const categoryBreakdown: CategoryStat[] = categories.map(category => {
      const count = activeTasks.filter(t => t.category === category).length;
      return {
        category,
        count,
        percentage: activeTasks.length > 0 ? Math.round((count / activeTasks.length) * 100) : 0,
      };
    });

    return { creationHeatmap, completionTrend, categoryBreakdown };
  }, [enrichedTasks]);

  // Filter tasks by tab
  const filteredByTab = useMemo(() => {
    const now = new Date();
    const weekAgo = subDays(now, 7);
    
    switch (activeTab) {
      case 'active':
        return enrichedTasks.filter(t => !t.isCompleted);
      case 'completed':
        return enrichedTasks.filter(t => t.isCompleted);
      case 'zombie':
        return enrichedTasks.filter(t => t.isZombie);
      case 'recent':
        return enrichedTasks.filter(t => {
          const createdAt = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
          return createdAt >= weekAgo;
        });
      default:
        return enrichedTasks;
    }
  }, [enrichedTasks, activeTab]);

  // Apply search filter
  const searchedTasks = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTab;
    const query = searchQuery.toLowerCase();
    return filteredByTab.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query) ||
      t.projectName?.toLowerCase().includes(query)
    );
  }, [filteredByTab, searchQuery]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...searchedTasks].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'context':
          comparison = a.context.localeCompare(b.context);
          break;
        case 'age':
          comparison = a.age - b.age;
          break;
        case 'estimatedTime':
          comparison = a.estimatedTime - b.estimatedTime;
          break;
        case 'project':
          comparison = (a.projectName || '').localeCompare(b.projectName || '');
          break;
        case 'status':
          comparison = (a.isCompleted ? 1 : 0) - (b.isCompleted ? 1 : 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [searchedTasks, sortField, sortDirection]);

  // Recent activity (simulated from task data)
  const recentActivity = useMemo((): ActivityItem[] => {
    // Generate activity from task creation dates
    const activities: ActivityItem[] = enrichedTasks
      .slice(0, 20)
      .map(task => ({
        id: `activity-${task.id}`,
        type: task.isCompleted ? 'completed' as const : 'created' as const,
        taskName: task.name,
        taskId: task.id,
        timestamp: task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt),
      }));
    
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [enrichedTasks]);

  // Actions
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const selectAllTasks = useCallback(() => {
    setSelectedTasks(new Set(sortedTasks.map(t => t.id)));
  }, [sortedTasks]);

  const clearSelection = useCallback(() => {
    setSelectedTasks(new Set());
  }, []);

  // Stats for header
  const stats = useMemo(() => ({
    total: enrichedTasks.length,
    active: enrichedTasks.filter(t => !t.isCompleted).length,
    completed: enrichedTasks.filter(t => t.isCompleted).length,
    zombie: insights.zombieTasks.length,
  }), [enrichedTasks, insights.zombieTasks]);

  return {
    data: {
      tasks: sortedTasks,
      insights,
      charts,
      recentActivity,
      stats,
    },
    state: {
      loading: false,
      isEmpty: enrichedTasks.length === 0,
      activeTab,
      sortField,
      sortDirection,
      searchQuery,
      selectedTasks,
    },
    actions: {
      setActiveTab,
      handleSort,
      setSearchQuery,
      toggleTaskSelection,
      selectAllTasks,
      clearSelection,
      toggleTaskCompletion: viewData.toggleTaskCompletion,
      removeTask: viewData.removeTask,
      restoreTask: viewData.restoreTask,
    },
  };
};

export type ObservatoryViewDataReturn = ReturnType<typeof useObservatoryViewData>;
