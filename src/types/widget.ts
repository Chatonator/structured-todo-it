import { ReactNode } from 'react';

/** Identifiant unique de chaque type de widget */
export type WidgetId = 'priority-tasks' | 'active-project' | 'today-habits';

/** Configuration d'un widget dans le layout */
export interface WidgetConfig {
  id: WidgetId;
  label: string;
  icon: string; // emoji
  visible: boolean;
  order: number;
  /** Taille du widget dans la grille (1 = demi-largeur, 2 = pleine largeur) */
  span?: 1 | 2;
}

/** Layout complet du dashboard */
export interface DashboardLayout {
  widgets: WidgetConfig[];
}

/** Registre des widgets disponibles */
export const WIDGET_REGISTRY: Record<WidgetId, Omit<WidgetConfig, 'order' | 'visible'>> = {
  'priority-tasks': {
    id: 'priority-tasks',
    label: 'Tâches prioritaires',
    icon: '🎯',
    span: 1,
  },
  'active-project': {
    id: 'active-project',
    label: 'Projet en cours',
    icon: '📁',
    span: 1,
  },
  'today-habits': {
    id: 'today-habits',
    label: 'Habitudes du jour',
    icon: '💪',
    span: 2,
  },
};

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  widgets: [
    { ...WIDGET_REGISTRY['priority-tasks'], order: 0, visible: true },
    { ...WIDGET_REGISTRY['active-project'], order: 1, visible: true },
    { ...WIDGET_REGISTRY['today-habits'], order: 2, visible: true },
  ],
};
