import { lazy, ComponentType } from 'react';
import { 
  Home, 
  Telescope, 
  Calendar, 
  FolderKanban, 
  Target, 
  Award,
  Grid3X3,
  Users,
} from 'lucide-react';

// Base view props that all views should accept
export interface BaseViewProps {
  className?: string;
}

// Loading variant for skeleton states
export type LoadingVariant = 'cards' | 'list' | 'grid' | 'kanban' | 'timeline';

// View configuration interface
export interface ViewConfig {
  id: string;
  title: string;
  subtitle?: string;
  icon: typeof Home;
  component: ComponentType<any>;
  order: number;
  group: 'main' | 'productivity' | 'tracking' | 'other' | 'team';
  requiresAuth?: boolean;
  loadingVariant?: LoadingVariant;
}

// Lazy load all views - using new organized structure
const HomeView = lazy(() => import('@/components/views/home/HomeView'));
const ObservatoryView = lazy(() => import('@/components/views/observatory/ObservatoryView'));
const TimelineView = lazy(() => import('@/components/views/timeline/TimelineView'));
const ProjectsView = lazy(() => import('@/components/views/projects/ProjectsView'));
const HabitsView = lazy(() => import('@/components/views/habits/HabitsView'));
const RewardsView = lazy(() => import('@/components/views/rewards/RewardsView'));
const EisenhowerView = lazy(() => import('@/components/views/eisenhower/EisenhowerView'));
const TeamTasksView = lazy(() => import('@/components/views/teams/TeamTasksView'));

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
    loadingVariant: 'cards',
  },
  observatory: {
    id: 'observatory',
    title: 'Observatoire',
    subtitle: 'Analysez vos patterns de productivité',
    icon: Telescope,
    component: ObservatoryView,
    order: 2,
    group: 'main',
    loadingVariant: 'cards',
  },
  timeline: {
    id: 'timeline',
    title: 'Timeline',
    subtitle: 'Visualiser votre planning',
    icon: Calendar,
    component: TimelineView,
    order: 3,
    group: 'productivity',
    loadingVariant: 'timeline',
  },
  projects: {
    id: 'projects',
    title: 'Projets',
    subtitle: 'Gérer vos projets',
    icon: FolderKanban,
    component: ProjectsView,
    order: 4,
    group: 'productivity',
    loadingVariant: 'kanban',
  },
  habits: {
    id: 'habits',
    title: 'Habitudes',
    subtitle: 'Suivre vos habitudes',
    icon: Target,
    component: HabitsView,
    order: 5,
    group: 'tracking',
    loadingVariant: 'cards',
  },
  rewards: {
    id: 'rewards',
    title: 'Récompenses',
    subtitle: 'Vos accomplissements',
    icon: Award,
    component: RewardsView,
    order: 6,
    group: 'tracking',
    loadingVariant: 'cards',
  },
  eisenhower: {
    id: 'eisenhower',
    title: 'Matrice Eisenhower',
    subtitle: 'Prioriser par importance et urgence',
    icon: Grid3X3,
    component: EisenhowerView,
    order: 7,
    group: 'productivity',
    loadingVariant: 'grid',
  },
  team: {
    id: 'team',
    title: 'Équipe',
    subtitle: 'Tâches partagées avec votre équipe',
    icon: Users,
    component: TeamTasksView,
    order: 8,
    group: 'team',
    loadingVariant: 'list',
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
