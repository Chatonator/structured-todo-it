// Exports centralisés des hooks de données pour les vues

export { useTasksViewData, type TasksViewDataReturn, type ContextFilter } from './useTasksViewData';
export { useHabitsViewData, type HabitsViewDataReturn } from './useHabitsViewData';
export { useRecurringViewData, type RecurringViewDataReturn } from './useRecurringViewData';
export { useProjectsViewData, type ProjectsViewDataReturn } from './useProjectsViewData';

// Hooks de vue spécialisés (pattern { data, state, actions })
export { useHomeViewData, type HomeViewDataReturn } from './useHomeViewData';
export { useTimelineViewData, type TimelineViewDataReturn, type ViewMode } from './useTimelineViewData';
export { useRewardsViewData, type RewardsViewDataReturn } from './useRewardsViewData';
export { useHabitsFullViewData, type HabitsFullViewDataReturn } from './useHabitsFullViewData';
export { useProjectsFullViewData, type ProjectsFullViewDataReturn } from './useProjectsFullViewData';
export { useTeamViewData, type TeamViewDataReturn } from './useTeamViewData';

// Observatory View
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
