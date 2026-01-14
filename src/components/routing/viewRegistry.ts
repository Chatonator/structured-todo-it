import { lazy, ComponentType } from 'react';
import { 
  Home, 
  CheckSquare, 
  Calendar, 
  FolderKanban, 
  Target, 
  Award,
  Grid3X3,
  CheckCircle,
  Users
} from 'lucide-react';

// Base view props that all views should accept
export interface BaseViewProps {
  className?: string;
}

// View configuration interface
export interface ViewConfig {
  id: string;
  title: string;
  subtitle?: string;
  icon: typeof Home;
  component: ComponentType<any>;
  order: number;
  group: 'main' | 'productivity' | 'tracking' | 'other';
  requiresAuth?: boolean;
}

// Lazy load all views for performance
const HomeView = lazy(() => import('@/components/views/HomeView'));
const TasksView = lazy(() => import('@/components/views/TasksView'));
const TimelineView = lazy(() => import('@/components/timeline/TimelineView'));
const ProjectsView = lazy(() => import('@/components/projects/ProjectsView'));
const HabitsView = lazy(() => import('@/components/habits/HabitsView'));
const RewardsView = lazy(() => import('@/components/rewards/RewardsView'));
const EisenhowerView = lazy(() => import('@/components/views/EisenhowerView'));
const CompletedTasksView = lazy(() => import('@/components/views/CompletedTasksView'));

// View Registry - Single source of truth for all views
export const viewRegistry: Record<string, ViewConfig> = {
  home: {
    id: 'home',
    title: 'Accueil',
    subtitle: 'Vue d\'ensemble de votre journée',
    icon: Home,
    component: HomeView,
    order: 1,
    group: 'main',
  },
  tasks: {
    id: 'tasks',
    title: 'Tâches',
    subtitle: 'Gérer vos tâches quotidiennes',
    icon: CheckSquare,
    component: TasksView,
    order: 2,
    group: 'main',
  },
  timeline: {
    id: 'timeline',
    title: 'Timeline',
    subtitle: 'Visualiser votre planning',
    icon: Calendar,
    component: TimelineView,
    order: 3,
    group: 'productivity',
  },
  projects: {
    id: 'projects',
    title: 'Projets',
    subtitle: 'Gérer vos projets',
    icon: FolderKanban,
    component: ProjectsView,
    order: 4,
    group: 'productivity',
  },
  habits: {
    id: 'habits',
    title: 'Habitudes',
    subtitle: 'Suivre vos habitudes',
    icon: Target,
    component: HabitsView,
    order: 5,
    group: 'tracking',
  },
  rewards: {
    id: 'rewards',
    title: 'Récompenses',
    subtitle: 'Vos accomplissements',
    icon: Award,
    component: RewardsView,
    order: 6,
    group: 'tracking',
  },
  eisenhower: {
    id: 'eisenhower',
    title: 'Matrice Eisenhower',
    subtitle: 'Prioriser par importance et urgence',
    icon: Grid3X3,
    component: EisenhowerView,
    order: 7,
    group: 'productivity',
  },
  completed: {
    id: 'completed',
    title: 'Tâches terminées',
    subtitle: 'Historique des tâches complétées',
    icon: CheckCircle,
    component: CompletedTasksView,
    order: 8,
    group: 'other',
  },
};

// Helper functions
export const getViewConfig = (viewId: string): ViewConfig | undefined => {
  return viewRegistry[viewId];
};

export const getViewsByGroup = (group: ViewConfig['group']): ViewConfig[] => {
  return Object.values(viewRegistry)
    .filter(view => view.group === group)
    .sort((a, b) => a.order - b.order);
};

export const getAllViews = (): ViewConfig[] => {
  return Object.values(viewRegistry).sort((a, b) => a.order - b.order);
};

export const getDefaultView = (): string => 'home';
