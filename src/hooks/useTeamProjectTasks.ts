/**
 * Hook pour gérer les tâches d'un projet d'équipe
 * Équivalent de useProjectTasks pour les équipes
 * Fournit les méthodes pour le Kanban (getTasksByColumns, updateTaskStatus)
 * et expose les actions CRUD de useTeamTasks pour éviter les doubles fetches
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
  // Exposed CRUD actions from useTeamTasks
  createTask: (taskData: Partial<TeamTask>) => Promise<any>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleComplete: (taskId: string, isCompleted: boolean) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<TeamTask>) => Promise<void>;
  assignTask: (taskId: string, userId: string | null) => Promise<void>;
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
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    assignTask,
    refreshTasks 
  } = useTeamTasks(teamId);

  // Filtrer les tâches pour ce projet
  const projectTasks = useMemo(() => {
    if (!projectId) return [];
    return allTasks.filter(task => task.project_id === projectId);
  }, [allTasks, projectId]);

  /**
   * Déterminer le statut Kanban d'une tâche
   */
  const getTaskStatus = useCallback((task: TeamTask): TeamTaskProjectStatus => {
    if (task.projectStatus) return task.projectStatus;
    if (task.isCompleted) return 'done';
    return 'todo';
  }, []);

  /**
   * Grouper les tâches par colonnes pour le Kanban
   */
  const getTasksByColumns = useCallback((columns?: KanbanColumnConfig[]): Record<string, TeamTask[]> => {
    const columnIds = columns?.map(c => c.id) || DEFAULT_COLUMN_IDS;
    
    const result: Record<string, TeamTask[]> = {};
    columnIds.forEach(id => { result[id] = []; });

    projectTasks.forEach(task => {
      const status = getTaskStatus(task);
      if (result[status]) {
        result[status].push(task);
      } else if (status === 'done') {
        const lastColumn = columnIds[columnIds.length - 1];
        result[lastColumn]?.push(task);
      } else {
        const firstColumn = columnIds[0] || 'todo';
        result[firstColumn]?.push(task);
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

  // Tâches groupées par statut
  const tasksByStatus = useMemo(() => ({
    todo: projectTasks.filter(t => !t.isCompleted),
    inProgress: [],
    done: projectTasks.filter(t => t.isCompleted)
  }), [projectTasks]);

  return {
    tasks: projectTasks,
    loading,
    getTasksByColumns,
    updateTaskStatus,
    tasksByStatus,
    reloadTasks: refreshTasks,
    createTask,
    deleteTask,
    toggleComplete,
    updateTask,
    assignTask,
  };
};
