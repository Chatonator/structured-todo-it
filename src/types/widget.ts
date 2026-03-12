export type WidgetId =
  | 'daily-overview'
  | 'priority-tasks'
  | 'today-timeline'
  | 'active-project'
  | 'today-habits'
  | 'observatory-snapshot'
  | 'rewards-snapshot'
  | 'team-snapshot'
  | 'quick-links';

export interface WidgetDefinition {
  id: WidgetId;
  label: string;
  description: string;
  icon: string;
  sourceView: string;
  span?: 1 | 2;
}

export interface WidgetConfig extends WidgetDefinition {
  visible: boolean;
  order: number;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
}

export const WIDGET_REGISTRY: Record<WidgetId, WidgetDefinition> = {
  'daily-overview': {
    id: 'daily-overview',
    label: 'Vue du jour',
    description: 'Le resume utile pour piloter votre journee.',
    icon: '☀️',
    sourceView: 'home',
    span: 2,
  },
  'priority-tasks': {
    id: 'priority-tasks',
    label: 'Taches prioritaires',
    description: 'Vos taches a fort impact a traiter en premier.',
    icon: '🎯',
    sourceView: 'tasks',
    span: 1,
  },
  'today-timeline': {
    id: 'today-timeline',
    label: 'Planning du jour',
    description: 'Les creneaux planifies et ce qui arrive ensuite.',
    icon: '🗓️',
    sourceView: 'timeline',
    span: 2,
  },
  'active-project': {
    id: 'active-project',
    label: 'Projet en cours',
    description: 'Le projet actif a suivre d’un coup d’oeil.',
    icon: '📁',
    sourceView: 'projects',
    span: 1,
  },
  'today-habits': {
    id: 'today-habits',
    label: 'Habitudes du jour',
    description: 'Les routines a maintenir aujourd’hui.',
    icon: '💪',
    sourceView: 'habits',
    span: 2,
  },
  'observatory-snapshot': {
    id: 'observatory-snapshot',
    label: 'Sante du backlog',
    description: 'Un apercu simple de la charge et des signaux faibles.',
    icon: '🔭',
    sourceView: 'observatory',
    span: 1,
  },
  'rewards-snapshot': {
    id: 'rewards-snapshot',
    label: 'Recompenses',
    description: 'Niveau, temps disponible et progression.',
    icon: '🏆',
    sourceView: 'rewards',
    span: 1,
  },
  'team-snapshot': {
    id: 'team-snapshot',
    label: 'Equipe',
    description: 'L’essentiel de votre espace collaboratif.',
    icon: '👥',
    sourceView: 'team',
    span: 1,
  },
  'quick-links': {
    id: 'quick-links',
    label: 'Raccourcis',
    description: 'Acces direct aux vues cles de l’application.',
    icon: '🧭',
    sourceView: 'toolbox',
    span: 2,
  },
};

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  widgets: [
    { ...WIDGET_REGISTRY['daily-overview'], order: 0, visible: true },
    { ...WIDGET_REGISTRY['priority-tasks'], order: 1, visible: true },
    { ...WIDGET_REGISTRY['active-project'], order: 2, visible: true },
    { ...WIDGET_REGISTRY['today-timeline'], order: 3, visible: true },
    { ...WIDGET_REGISTRY['today-habits'], order: 4, visible: true },
    { ...WIDGET_REGISTRY['observatory-snapshot'], order: 5, visible: true },
    { ...WIDGET_REGISTRY['rewards-snapshot'], order: 6, visible: true },
    { ...WIDGET_REGISTRY['team-snapshot'], order: 7, visible: true },
    { ...WIDGET_REGISTRY['quick-links'], order: 8, visible: true },
  ],
};
