
import { useState, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer la sélection multiple des tâches
 * Évite les conflits de sélection entre différentes vues
 */
export const useTaskSelection = () => {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const toggleSelection = useCallback((taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  }, []);

  const selectAll = useCallback((taskIds: string[]) => {
    setSelectedTasks(taskIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTasks([]);
  }, []);

  const isSelected = useCallback((taskId: string) => {
    return selectedTasks.includes(taskId);
  }, [selectedTasks]);

  return {
    selectedTasks,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    hasSelection: selectedTasks.length > 0,
    selectionCount: selectedTasks.length
  };
};
