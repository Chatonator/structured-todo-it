import { useMemo } from 'react';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { Task, TaskCategory, SubTaskCategory } from '@/types/task';

export type EisenhowerQuadrant = 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';

interface QuadrantConfig {
  title: string;
  description: string;
  color: string;
  borderColor: string;
}

// Configuration des quadrants
export const QUADRANT_CONFIGS: Record<EisenhowerQuadrant, QuadrantConfig> = {
  'urgent-important': {
    title: 'Urgent & Important',
    description: 'À faire immédiatement',
    color: 'bg-system-error/10',
    borderColor: 'border-system-error'
  },
  'not-urgent-important': {
    title: 'Important',
    description: 'À planifier',
    color: 'bg-system-warning/10',
    borderColor: 'border-system-warning'
  },
  'urgent-not-important': {
    title: 'Urgent',
    description: 'À déléguer',
    color: 'bg-system-info/10',
    borderColor: 'border-system-info'
  },
  'not-urgent-not-important': {
    title: 'Ni urgent ni important',
    description: 'À éliminer',
    color: 'bg-muted',
    borderColor: 'border-muted'
  }
};

// Mapping catégorie -> quadrant
const CATEGORY_TO_QUADRANT: Record<TaskCategory, EisenhowerQuadrant> = {
  'Obligation': 'urgent-important',
  'Quotidien': 'not-urgent-important',
  'Envie': 'urgent-not-important',
  'Autres': 'not-urgent-not-important'
};

/**
 * Détermine le quadrant d'une tâche selon sa catégorie et priorité
 */
function getTaskQuadrant(task: Task): EisenhowerQuadrant {
  // Utiliser la catégorie principale
  return CATEGORY_TO_QUADRANT[task.category] ?? 'not-urgent-not-important';
}

/**
 * Hook spécialisé pour les données de la matrice Eisenhower
 */
export const useEisenhowerViewData = () => {
  const viewData = useViewDataContext();

  // Tâches actives (non complétées, sans parent)
  const activeTasks = useMemo(() => 
    viewData.tasks.filter(t => !t.isCompleted && !t.parentId),
    [viewData.tasks]
  );

  // Grouper par quadrant
  const quadrants = useMemo(() => {
    const result: Record<EisenhowerQuadrant, Task[]> = {
      'urgent-important': [],
      'not-urgent-important': [],
      'urgent-not-important': [],
      'not-urgent-not-important': []
    };

    activeTasks.forEach(task => {
      const quadrant = getTaskQuadrant(task);
      result[quadrant].push(task);
    });

    return result;
  }, [activeTasks]);

  // Temps total par quadrant
  const quadrantTimes = useMemo(() => {
    const times: Record<EisenhowerQuadrant, number> = {
      'urgent-important': 0,
      'not-urgent-important': 0,
      'urgent-not-important': 0,
      'not-urgent-not-important': 0
    };

    Object.entries(quadrants).forEach(([key, tasks]) => {
      times[key as EisenhowerQuadrant] = tasks.reduce((sum, t) => sum + t.estimatedTime, 0);
    });

    return times;
  }, [quadrants]);

  // Statistiques globales
  const stats = useMemo(() => ({
    totalTasks: activeTasks.length,
    urgentImportant: quadrants['urgent-important'].length,
    important: quadrants['not-urgent-important'].length,
    urgent: quadrants['urgent-not-important'].length,
    neither: quadrants['not-urgent-not-important'].length
  }), [activeTasks, quadrants]);

  return {
    data: {
      quadrants,
      quadrantTimes,
      activeTasks,
      stats,
      configs: QUADRANT_CONFIGS
    },
    state: {
      loading: false,
      isEmpty: activeTasks.length === 0
    },
    actions: {
      toggleTaskCompletion: viewData.toggleTaskCompletion,
      updateTask: viewData.updateTask
    }
  };
};

export type EisenhowerViewDataReturn = ReturnType<typeof useEisenhowerViewData>;
