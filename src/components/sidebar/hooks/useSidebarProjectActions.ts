import { useCallback } from 'react';
import { Task } from '@/types/task';
import { useProjects } from '@/hooks/useProjects';

/**
 * Hook encapsulating project-related actions for the sidebar.
 * Extracted from AppSidebar for maintainability.
 */
export const useSidebarProjectActions = (
  tasks: Task[],
  getSubTasks: (parentId: string) => Task[]
) => {
  const { assignTaskToProject, createProjectFromTask } = useProjects();

  const handleAssignToProject = useCallback(async (taskId: string, projectId: string): Promise<boolean> => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    const success = await assignTaskToProject(taskId, projectId);
    
    if (success && task.level === 0) {
      const assignSubtasksRecursively = async (parentId: string) => {
        const subTasks = getSubTasks(parentId);
        for (const subTask of subTasks) {
          await assignTaskToProject(subTask.id, projectId);
          await assignSubtasksRecursively(subTask.id);
        }
      };
      await assignSubtasksRecursively(taskId);
    }
    
    return success;
  }, [tasks, getSubTasks, assignTaskToProject]);

  const handleCreateProjectFromTask = useCallback(async (task: Task, subTasks: Task[]) => {
    await createProjectFromTask(
      task.id,
      task.name,
      subTasks.map(st => ({
        id: st.id,
        name: st.name,
        metadata: {
          category: st.category,
          subCategory: st.subCategory,
          context: st.context,
          estimatedTime: st.estimatedTime,
          duration: st.duration,
        }
      })),
      { description: `Projet créé à partir de la tâche "${task.name}"` }
    );
  }, [createProjectFromTask]);

  return { handleAssignToProject, handleCreateProjectFromTask };
};
