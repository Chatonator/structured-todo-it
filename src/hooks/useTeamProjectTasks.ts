/**
 * Hook pour gérer les tâches d'un projet d'équipe
 * Équivalent de useProjectTasks pour les équipes
 * Fournit les méthodes pour le Kanban (getTasksByColumns, updateTaskStatus)
 */

import { useMemo, useCallback } from 'react';
import { useTeamTasks, TeamTask } from './useTeamTasks';
import { KanbanColumnConfig } from '@/types/item';
import { supabase } from '@/integrations/supabase/client';

// Colonnes par défaut pour le Kanban équipe
const DEFAULT_COLUMN_IDS = ['todo', 'in-progress', 'done'];

// Statut de tâche pour le Kanban
export type TeamTaskProjectStatus = 'todo' | 'in-progress' | 'done' | string;

export interface TeamProjectTasksResult {
  tasks: TeamTask[];
  loading: boolean;
  getTasksByColumns: (columns?: KanbanColumnConfig[]) => Record<string, TeamTask[]>;
  updateTaskStatus: (taskId: string, newStatus: TeamTaskProjectStatus) => Promise<boolean>;
  tasksByStatus: {
    todo: TeamTask[];
    inProgress: TeamTask[];
    done: TeamTask[];
  };
  reloadTasks: () => void;
}

// Extended TeamTask with project_status field (from DB)
interface TeamTaskWithProjectStatus {
  projectStatus?: string;
}

/**
 * Hook pour obtenir les tâches d'un projet d'équipe spécifique
 * et les gérer dans un Kanban
 */
export const useTeamProjectTasks = (
  teamId: string | null,
  projectId: string | null
): TeamProjectTasksResult => {
  const { 
    tasks: allTasks, 
    loading, 
    updateTask,
    toggleComplete,
    refreshTasks 
  } = useTeamTasks(teamId);

  // Filtrer les tâches pour ce projet
  const projectTasks = useMemo(() => {
    if (!projectId) return [];
    return allTasks.filter(task => task.project_id === projectId);
  }, [allTasks, projectId]);

  /**
   * Déterminer le statut Kanban d'une tâche
   * Utilise project_status si défini, sinon fallback sur isCompleted
   */
  const getTaskStatus = useCallback((task: TeamTask & TeamTaskWithProjectStatus): TeamTaskProjectStatus => {
    // Si project_status est défini, l'utiliser
    if (task.projectStatus) return task.projectStatus;
    // Fallback sur isCompleted
    if (task.isCompleted) return 'done';
    return 'todo';
  }, []);

  /**
   * Grouper les tâches par colonnes pour le Kanban
   * Supporte les colonnes personnalisées
   */
  const getTasksByColumns = useCallback((columns?: KanbanColumnConfig[]): Record<string, TeamTask[]> => {
    const columnIds = columns?.map(c => c.id) || DEFAULT_COLUMN_IDS;
    
    const result: Record<string, TeamTask[]> = {};
    columnIds.forEach(id => {
      result[id] = [];
    });

    projectTasks.forEach(task => {
      const status = getTaskStatus(task);
      
      // Mapper le statut aux colonnes disponibles
      if (result[status]) {
        result[status].push(task);
      } else {
        // Fallback: done -> dernière colonne, sinon -> première colonne
        if (status === 'done') {
          const lastColumn = columnIds[columnIds.length - 1];
          result[lastColumn]?.push(task);
        } else {
          const firstColumn = columnIds[0] || 'todo';
          result[firstColumn]?.push(task);
        }
      }
    });

    return result;
  }, [projectTasks, getTaskStatus]);

  /**
   * Mettre à jour le statut d'une tâche (pour le drag & drop du Kanban)
   */
  const updateTaskStatus = useCallback(async (
    taskId: string,
    newStatus: TeamTaskProjectStatus
  ): Promise<boolean> => {
    const isCompleted = newStatus === 'done';
    
    try {
      // Mise à jour directe dans Supabase avec project_status
      const { error } = await supabase
        .from('team_tasks')
        .update({
          project_status: newStatus,
          iscompleted: isCompleted,
          ...(isCompleted ? { lastcompletedat: new Date().toISOString() } : {})
        })
        .eq('id', taskId);
      
      if (error) throw error;
      
      refreshTasks();
      return true;
    } catch {
      return false;
    }
  }, [refreshTasks]);

  // Tâches groupées par statut (format legacy pour compatibilité)
  const tasksByStatus = useMemo(() => ({
    todo: projectTasks.filter(t => !t.isCompleted),
    inProgress: [], // Pas de statut intermédiaire pour l'instant
    done: projectTasks.filter(t => t.isCompleted)
  }), [projectTasks]);

  return {
    tasks: projectTasks,
    loading,
    getTasksByColumns,
    updateTaskStatus,
    tasksByStatus,
    reloadTasks: refreshTasks
  };
};
