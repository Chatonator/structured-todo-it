// View Layout System - Phase 1 & 2 of the refactoring
// Provides consistent structure for all views in the application

// Core layout components
export { ViewLayout, type ViewLayoutProps, type ViewState } from './ViewLayout';
export { ViewHeader, type ViewHeaderProps } from './ViewHeader';
export { ViewContent, type ViewContentProps } from './ViewContent';

// State components
export { ViewEmptyState, type ViewEmptyStateProps } from './ViewEmptyState';
export { ViewLoadingState, type ViewLoadingStateProps } from './ViewLoadingState';
export { ViewErrorState, type ViewErrorStateProps } from './ViewErrorState';

// Enriched components (Phase 2)
export { ViewStats, type ViewStatsProps, type ViewStatsItem } from './ViewStats';
export { ViewToolbar, type ViewToolbarProps, type FilterOption, type SortOption } from './ViewToolbar';
export { ViewTabs, type ViewTabsProps, type ViewTab } from './ViewTabs';
export { ViewSection, type ViewSectionProps } from './ViewSection';
