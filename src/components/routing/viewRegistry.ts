import { lazy, ComponentType } from 'react';
import { Home, Telescope, Calendar, FolderKanban, Target, Award, Wrench, Users, CheckSquare } from 'lucide-react';
import { MobileSupportLevel, MobilePlacement, MobileViewConfig, mobileViewConfig } from './mobileViewConfig';

export type { MobileSupportLevel, MobilePlacement, MobileViewConfig } from './mobileViewConfig';

export interface BaseViewProps {
  className?: string;
}

export type LoadingVariant = 'cards' | 'list' | 'grid' | 'kanban' | 'timeline';

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
  mobile: MobileViewConfig;
}

const HomeView = lazy(() => import('@/components/views/home/HomeView'));
const TasksView = lazy(() => import('@/components/views/tasks/TasksView'));
const ObservatoryView = lazy(() => import('@/components/views/observatory/ObservatoryView'));
const TimelineView = lazy(() => import('@/components/views/timeline/TimelineView'));
const ProjectsView = lazy(() => import('@/components/views/projects/ProjectsView'));
const HabitsView = lazy(() => import('@/components/views/habits/HabitsView'));
const RewardsView = lazy(() => import('@/components/views/rewards/RewardsView'));
const ToolboxView = lazy(() => import('@/components/views/toolbox/ToolboxView'));
const TeamTasksView = lazy(() => import('@/components/views/teams/TeamTasksView'));

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
    mobile: mobileViewConfig.home,
  },
  tasks: {
    id: 'tasks',
    title: 'Tâches',
    subtitle: 'Pilotez votre backlog quotidien',
    icon: CheckSquare,
    component: TasksView,
    order: 2,
    group: 'productivity',
    loadingVariant: 'list',
    mobile: mobileViewConfig.tasks,
  },
  observatory: {
    id: 'observatory',
    title: 'Observatoire',
    subtitle: 'Analysez vos patterns de productivité',
    icon: Telescope,
    component: ObservatoryView,
    order: 3,
    group: 'main',
    loadingVariant: 'cards',
    mobile: mobileViewConfig.observatory,
  },
  timeline: {
    id: 'timeline',
    title: 'Timeline',
    subtitle: 'Visualiser votre planning',
    icon: Calendar,
    component: TimelineView,
    order: 4,
    group: 'productivity',
    loadingVariant: 'timeline',
    mobile: mobileViewConfig.timeline,
  },
  projects: {
    id: 'projects',
    title: 'Projets',
    subtitle: 'Gérer vos projets',
    icon: FolderKanban,
    component: ProjectsView,
    order: 5,
    group: 'productivity',
    loadingVariant: 'kanban',
    mobile: mobileViewConfig.projects,
  },
  habits: {
    id: 'habits',
    title: 'Habitudes',
    subtitle: 'Suivre vos habitudes',
    icon: Target,
    component: HabitsView,
    order: 6,
    group: 'tracking',
    loadingVariant: 'cards',
    mobile: mobileViewConfig.habits,
  },
  rewards: {
    id: 'rewards',
    title: 'Récompenses',
    subtitle: 'Vos accomplissements',
    icon: Award,
    component: RewardsView,
    order: 7,
    group: 'tracking',
    loadingVariant: 'cards',
    mobile: mobileViewConfig.rewards,
  },
  toolbox: {
    id: 'toolbox',
    title: 'Boîte à outils',
    subtitle: 'Méthodes de productivité',
    icon: Wrench,
    component: ToolboxView,
    order: 8,
    group: 'productivity',
    loadingVariant: 'grid',
    mobile: mobileViewConfig.toolbox,
  },
  team: {
    id: 'team',
    title: 'Équipe',
    subtitle: 'Tâches partagées avec votre équipe',
    icon: Users,
    component: TeamTasksView,
    order: 9,
    group: 'team',
    loadingVariant: 'list',
    mobile: mobileViewConfig.team,
  },
};

export const getViewConfig = (viewId: string): ViewConfig | undefined => {
  return viewRegistry[viewId];
};

export const getViewsByGroup = (group: ViewConfig['group']): ViewConfig[] => {
  return Object.values(viewRegistry)
    .filter((view) => view.group === group)
    .sort((a, b) => a.order - b.order);
};

export const getAllViews = (): ViewConfig[] => {
  return Object.values(viewRegistry).sort((a, b) => a.order - b.order);
};

export const getMobileViewsByPlacement = (placement: MobilePlacement): ViewConfig[] => {
  return Object.values(viewRegistry)
    .filter((view) => view.mobile.placement === placement)
    .sort((a, b) => a.mobile.priority - b.mobile.priority);
};

export const getMobilePrimaryViews = (): ViewConfig[] => {
  return getMobileViewsByPlacement('primary');
};

export const getMobileMoreViews = (): ViewConfig[] => {
  return getMobileViewsByPlacement('more');
};

export const isPrimaryMobileView = (viewId: string): boolean => {
  return getViewConfig(viewId)?.mobile.placement === 'primary';
};

export const getDefaultView = (): string => 'home';
