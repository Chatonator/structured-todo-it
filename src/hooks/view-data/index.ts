// Exports centralisés des hooks de données pour les vues

export { useTasksViewData, type TasksViewDataReturn, type ContextFilter } from './useTasksViewData';
export { useHabitsViewData, type HabitsViewDataReturn } from './useHabitsViewData';
export { useRecurringViewData, type RecurringViewDataReturn } from './useRecurringViewData';
export { useProjectsViewData, type ProjectsViewDataReturn } from './useProjectsViewData';

// Hooks de vue spécialisés
export { useHomeViewData, type HomeViewDataReturn } from './useHomeViewData';
export { useEisenhowerViewData, type EisenhowerViewDataReturn, type EisenhowerQuadrant, QUADRANT_CONFIGS } from './useEisenhowerViewData';
export { useTimelineViewData, type TimelineViewDataReturn, type ViewMode } from './useTimelineViewData';
export { useRewardsViewData, type RewardsViewDataReturn } from './useRewardsViewData';

// Observatory View (remplace TasksView et CompletedTasksView)
export { 
  useObservatoryViewData, 
  type ObservatoryViewDataReturn,
  type EnrichedTask,
  type TabFilter,
  type SortField,
  type SortDirection,
  type HeatmapDay,
  type TrendPoint,
  type CategoryStat,
  type ActivityItem,
  type InsightsData,
  type ChartsData,
} from './useObservatoryViewData';
