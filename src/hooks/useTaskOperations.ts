
import { useCallback } from 'react';
import { Task } from '@/types/task';

/**
 * Hook personnalisé pour les opérations sur les tâches
 * Centralise les actions pour éviter les doublons et inconsistances
 */
export const useTaskOperations = (
  onRemoveTask: (taskId: string) => void,
  onToggleCompletion: (taskId: string) => void,
  onTogglePinTask: (taskId: string) => void
) => {
  
  const handleBulkComplete = useCallback((taskIds: string[]) => {
    taskIds.forEach(taskId => {
      onToggleCompletion(taskId);
    });
  }, [onToggleCompletion]);

  const handleBulkDelete = useCallback((taskIds: string[]) => {
    taskIds.forEach(taskId => {
      onRemoveTask(taskId);
    });
  }, [onRemoveTask]);

  const handleBulkPin = useCallback((taskIds: string[]) => {
    taskIds.forEach(taskId => {
      onTogglePinTask(taskId);
    });
  }, [onTogglePinTask]);

  return {
    handleBulkComplete,
    handleBulkDelete,
    handleBulkPin
  };
};
