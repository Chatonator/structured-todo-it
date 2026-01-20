import { useMemo } from 'react';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { Task } from '@/types/task';

/**
 * Hook spécialisé pour les données de la HomeView
 * Retourne les données préparées spécifiquement pour le dashboard
 */
export const useHomeViewData = () => {
  const viewData = useViewDataContext();

  // Tâches actives (non complétées)
  const activeTasks = useMemo(() => 
    viewData.tasks.filter(t => !t.isCompleted),
    [viewData.tasks]
  );

  // Tâches pinnées (déjà des Task[])
  const pinnedTasks = useMemo(() => 
    (viewData.pinnedTasks as Task[]).filter(t => !t.isCompleted),
    [viewData.pinnedTasks]
  );

  // Top 5 tâches prioritaires
  const topPriorityTasks = useMemo(() => {
    const pinnedActive = pinnedTasks.slice(0, 3);
    const pinnedIds = new Set(pinnedActive.map(t => t.id));
    
    const others = activeTasks
      .filter(t => !t.parentId && !pinnedIds.has(t.id))
      .sort((a, b) => a.estimatedTime - b.estimatedTime)
      .slice(0, 5 - pinnedActive.length);
    
    return [...pinnedActive, ...others];
  }, [activeTasks, pinnedTasks]);

  // Projet actif
  const activeProject = useMemo(() => {
    return viewData.projects.find(p => p.status === 'in-progress');
  }, [viewData.projects]);

  // Statistiques
  const stats = useMemo(() => ({
    totalTasks: activeTasks.length,
    completedToday: viewData.tasks.filter(t => t.isCompleted).length,
    totalTime: activeTasks.reduce((sum, t) => sum + t.estimatedTime, 0),
    habitsCompletion: viewData._habitsData?.getTodayCompletionRate?.() ?? 0
  }), [activeTasks, viewData.tasks, viewData._habitsData]);

  return {
    data: {
      activeTasks,
      topPriorityTasks,
      pinnedTasks,
      activeProject,
      todayHabits: viewData.todayHabits,
      projects: viewData.projects,
      stats
    },
    state: {
      loading: !viewData.tasks,
      isEmpty: activeTasks.length === 0 && viewData.todayHabits.length === 0
    },
    actions: {
      toggleTaskCompletion: viewData.toggleTaskCompletion,
      toggleHabitCompletion: viewData.toggleHabitCompletion,
      addTask: viewData.addTask
    }
  };
};

export type HomeViewDataReturn = ReturnType<typeof useHomeViewData>;
