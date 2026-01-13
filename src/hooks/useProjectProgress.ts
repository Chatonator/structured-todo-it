// Hook pour calculer la progression d'un projet dynamiquement
import { useMemo } from 'react';
import { useItems } from './useItems';

export const useProjectProgress = (projectId: string) => {
  const { items } = useItems({ contextTypes: ['project_task'] });

  const progress = useMemo(() => {
    const projectTasks = items.filter(item => item.parentId === projectId);
    const total = projectTasks.length;
    
    if (total === 0) return 0;
    
    const done = projectTasks.filter(item => item.isCompleted).length;
    return Math.round((done / total) * 100);
  }, [items, projectId]);

  return progress;
};
