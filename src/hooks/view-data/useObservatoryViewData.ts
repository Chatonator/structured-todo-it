import { useMemo, useState, useCallback } from 'react';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { Task, TaskCategory } from '@/types/task';
import { useProjects } from '@/hooks/useProjects';
import { subDays } from 'date-fns';
import { enrichTasks, calculateInsights, calculateCharts, groupTasks, buildRecentActivity } from './observatoryComputations';

// ============= Types =============
export type TabFilter = 'active' | 'completed' | 'zombie' | 'recent';
export type SortField = 'name' | 'category' | 'context' | 'age' | 'estimatedTime' | 'project' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface HeatmapDay { date: string; count: number; }
export interface TrendPoint { date: string; label: string; completed: number; created: number; }
export interface CategoryStat { category: TaskCategory; count: number; percentage: number; }
export interface ActivityItem { id: string; type: 'created' | 'completed' | 'restored'; taskName: string; taskId: string; timestamp: Date; }

export interface EnrichedTask extends Task {
  age: number; ageLabel: string; isZombie: boolean; projectName?: string;
}

export interface TaskGroup {
  id: string; name: string; tasks: EnrichedTask[]; totalTime: number;
  completedCount: number; subGroups?: TaskGroup[];
}

export interface InsightsData {
  zombieTasks: EnrichedTask[]; velocityThisWeek: number; velocityLastWeek: number;
  velocityChange: number; timeRecovered: number; createdThisWeek: number;
  completedThisWeek: number; healthRatio: number;
}

export interface ChartsData {
  creationHeatmap: HeatmapDay[]; completionTrend: TrendPoint[]; categoryBreakdown: CategoryStat[];
}

// ============= Hook =============
export const useObservatoryViewData = () => {
  const viewData = useViewDataContext();
  const { projects } = useProjects();
  
  const [activeTab, setActiveTab] = useState<TabFilter>('active');
  const [sortField, setSortField] = useState<SortField>('age');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const projectLookup = useMemo(() => new Map(projects.map(p => [p.id, p.name])), [projects]);
  const enrichedTasks = useMemo(() => enrichTasks(viewData.tasks, projectLookup), [viewData.tasks, projectLookup]);
  const insights = useMemo(() => calculateInsights(enrichedTasks), [enrichedTasks]);
  const charts = useMemo(() => calculateCharts(enrichedTasks), [enrichedTasks]);

  // Filter by tab
  const filteredByTab = useMemo(() => {
    const weekAgo = subDays(new Date(), 7);
    switch (activeTab) {
      case 'active': return enrichedTasks.filter(t => !t.isCompleted);
      case 'completed': return enrichedTasks.filter(t => t.isCompleted);
      case 'zombie': return enrichedTasks.filter(t => t.isZombie);
      case 'recent': return enrichedTasks.filter(t => {
        const createdAt = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
        return createdAt >= weekAgo;
      });
      default: return enrichedTasks;
    }
  }, [enrichedTasks, activeTab]);

  // Search
  const searchedTasks = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTab;
    const query = searchQuery.toLowerCase();
    return filteredByTab.filter(t => 
      t.name.toLowerCase().includes(query) || t.category.toLowerCase().includes(query) || t.projectName?.toLowerCase().includes(query)
    );
  }, [filteredByTab, searchQuery]);

  // Sort
  const sortedTasks = useMemo(() => {
    return [...searchedTasks].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'category': cmp = a.category.localeCompare(b.category); break;
        case 'context': cmp = a.context.localeCompare(b.context); break;
        case 'age': cmp = a.age - b.age; break;
        case 'estimatedTime': cmp = a.estimatedTime - b.estimatedTime; break;
        case 'project': cmp = (a.projectName || '').localeCompare(b.projectName || ''); break;
        case 'status': cmp = (a.isCompleted ? 1 : 0) - (b.isCompleted ? 1 : 0); break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [searchedTasks, sortField, sortDirection]);

  const groupedTasks = useMemo(() => groupTasks(sortedTasks, projectLookup), [sortedTasks, projectLookup]);
  const recentActivity = useMemo(() => buildRecentActivity(enrichedTasks), [enrichedTasks]);

  // Actions
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('desc'); }
  }, [sortField]);

  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTasks(prev => { const next = new Set(prev); next.has(taskId) ? next.delete(taskId) : next.add(taskId); return next; });
  }, []);

  const selectAllTasks = useCallback(() => setSelectedTasks(new Set(sortedTasks.map(t => t.id))), [sortedTasks]);
  const clearSelection = useCallback(() => setSelectedTasks(new Set()), []);

  const stats = useMemo(() => ({
    total: enrichedTasks.length,
    active: enrichedTasks.filter(t => !t.isCompleted).length,
    completed: enrichedTasks.filter(t => t.isCompleted).length,
    zombie: insights.zombieTasks.length,
  }), [enrichedTasks, insights.zombieTasks]);

  return {
    data: { tasks: sortedTasks, groupedTasks, insights, charts, recentActivity, stats },
    state: { loading: false, isEmpty: enrichedTasks.length === 0, activeTab, sortField, sortDirection, searchQuery, selectedTasks },
    actions: {
      setActiveTab, handleSort, setSearchQuery, toggleTaskSelection, selectAllTasks, clearSelection,
      toggleTaskCompletion: viewData.toggleTaskCompletion, removeTask: viewData.removeTask, restoreTask: viewData.restoreTask,
    },
  };
};

export type ObservatoryViewDataReturn = ReturnType<typeof useObservatoryViewData>;
