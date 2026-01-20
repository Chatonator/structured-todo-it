import { useMemo, useState, useCallback } from 'react';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { Task } from '@/types/task';

export type SortOption = 'date' | 'duration' | 'name';

/**
 * Hook spécialisé pour les données de la vue des tâches terminées
 */
export const useCompletedViewData = () => {
  const viewData = useViewDataContext();
  const [sortBy, setSortBy] = useState<SortOption>('date');

  // Tâches complétées
  const completedTasks = useMemo(() => 
    viewData.tasks.filter(t => t.isCompleted),
    [viewData.tasks]
  );

  // Tri des tâches
  const sortedTasks = useMemo(() => {
    return [...completedTasks].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'duration':
          return b.estimatedTime - a.estimatedTime;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [completedTasks, sortBy]);

  // Statistiques
  const stats = useMemo(() => {
    const totalCompletedTime = completedTasks.reduce((sum, t) => sum + t.estimatedTime, 0);
    const averageTime = completedTasks.length > 0 
      ? Math.round(totalCompletedTime / completedTasks.length) 
      : 0;

    return {
      totalCount: completedTasks.length,
      totalTime: totalCompletedTime,
      averageTime
    };
  }, [completedTasks]);

  // Actions
  const handleSortChange = useCallback((value: SortOption) => {
    setSortBy(value);
  }, []);

  return {
    data: {
      completedTasks: sortedTasks,
      stats
    },
    state: {
      loading: false,
      isEmpty: completedTasks.length === 0,
      sortBy
    },
    actions: {
      restoreTask: viewData.restoreTask,
      removeTask: viewData.removeTask,
      setSortBy: handleSortChange
    }
  };
};

export type CompletedViewDataReturn = ReturnType<typeof useCompletedViewData>;
