import { useCallback, useEffect, useRef, useState } from 'react';
import { Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface AutoSaveState {
  isAutoSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  lastError: string | null;
}

interface AutoSaveOptions {
  debounceMs?: number;
  enabled?: boolean;
  onSave?: (tasks: Task[]) => Promise<boolean>;
  onError?: (error: string) => void;
}

export const useAutoSave = (
  tasks: Task[],
  options: AutoSaveOptions = {}
) => {
  const {
    debounceMs = 2000,
    enabled = true,
    onSave,
    onError
  } = options;

  const { toast } = useToast();
  const [state, setState] = useState<AutoSaveState>({
    isAutoSaving: false,
    hasUnsavedChanges: false,
    lastSaved: null,
    lastError: null
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastTasksRef = useRef<Task[]>(tasks);
  const saveInProgressRef = useRef(false);

  // Fonction de sauvegarde avec gestion d'erreurs
  const performSave = useCallback(async (tasksToSave: Task[]) => {
    if (!onSave || saveInProgressRef.current) return false;

    try {
      saveInProgressRef.current = true;
      setState(prev => ({ ...prev, isAutoSaving: true, lastError: null }));

      const success = await onSave(tasksToSave);
      
      if (success) {
        setState(prev => ({
          ...prev,
          isAutoSaving: false,
          hasUnsavedChanges: false,
          lastSaved: new Date()
        }));
        logger.info('Auto-save successful', { taskCount: tasksToSave.length });
        return true;
      } else {
        throw new Error('Save operation returned false');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown save error';
      setState(prev => ({
        ...prev,
        isAutoSaving: false,
        lastError: errorMessage
      }));
      
      logger.error('Auto-save failed', { error: errorMessage });
      onError?.(errorMessage);
      
      toast({
        title: "Erreur de sauvegarde",
        description: "Vos modifications n'ont pas pu être sauvegardées automatiquement.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      saveInProgressRef.current = false;
    }
  }, [onSave, onError, toast]);

  // Sauvegarde manuelle
  const manualSave = useCallback(async () => {
    const success = await performSave(tasks);
    if (success) {
      toast({
        title: "Sauvegarde réussie",
        description: "Vos modifications ont été sauvegardées.",
        variant: "default",
      });
    }
    return success;
  }, [performSave, tasks, toast]);

  // Détection des changements avec debounce
  useEffect(() => {
    if (!enabled || !onSave) return;

    const hasChanged = JSON.stringify(tasks) !== JSON.stringify(lastTasksRef.current);
    
    if (hasChanged) {
      setState(prev => ({ ...prev, hasUnsavedChanges: true }));
      lastTasksRef.current = tasks;

      // Annuler le timeout précédent
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Programmer la sauvegarde
      timeoutRef.current = setTimeout(() => {
        performSave(tasks);
      }, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [tasks, enabled, onSave, debounceMs, performSave]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Sauvegarde avant fermeture de page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.hasUnsavedChanges]);

  return {
    ...state,
    manualSave,
    canSave: !state.isAutoSaving && state.hasUnsavedChanges,
    getSaveStatus: () => {
      if (state.isAutoSaving) return 'saving';
      if (state.hasUnsavedChanges) return 'unsaved';
      if (state.lastError) return 'error';
      return 'saved';
    }
  };
};