// ============= Projects Hook (unified items wrapper) =============
// This hook wraps useItems to provide backward-compatible Project operations
// All data is now stored in the unified 'items' table

import { useCallback, useMemo } from 'react';
import { useItems } from './useItems';
import { useGamification } from './useGamification';
import { useToast } from './use-toast';
import { Project, ProjectStatus } from '@/types/project';
import { Item, ItemMetadata } from '@/types/item';

// Convert Item to Project for backward compatibility
function itemToProject(item: Item): Project {
  const meta = item.metadata || {};
  return {
    id: item.id,
    userId: item.userId,
    name: item.name,
    description: meta.description as string | undefined,
    icon: meta.icon as string | undefined,
    color: (meta.color as string) || '#a78bfa',
    status: (meta.status as ProjectStatus) || 'planning',
    targetDate: meta.targetDate ? new Date(meta.targetDate as unknown as string) : undefined,
    orderIndex: item.orderIndex,
    progress: (meta.progress as number) || 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    completedAt: meta.completedAt ? new Date(meta.completedAt as unknown as string) : undefined,
  };
}

// Convert Project to Item metadata
function projectToItemMetadata(project: Partial<Project>): Partial<ItemMetadata> {
  return {
    description: project.description,
    icon: project.icon,
    color: project.color,
    status: project.status,
    targetDate: project.targetDate,
    progress: project.progress,
    completedAt: project.completedAt,
    // Required harmonized fields
    category: 'Projet' as any,
    context: 'Perso' as any,
    estimatedTime: 60,
  };
}

export const useProjects = () => {
  const { 
    items, 
    loading, 
    createItem, 
    updateItem, 
    deleteItem,
    reload 
  } = useItems({ contextTypes: ['project'] });
  
  const { toast } = useToast();
  const { rewardProjectCreation, rewardProjectCompletion } = useGamification();

  // Convert items to projects
  const projects = useMemo(() => items.map(itemToProject), [items]);

  // Active projects (not archived)
  const activeProjects = useCallback(() => {
    return projects.filter(p => p.status !== 'archived');
  }, [projects]);

  // Create project
  const createProject = useCallback(async (
    name: string,
    description?: string,
    icon?: string,
    color?: string
  ) => {
    try {
      const newItem = await createItem({
        name,
        contextType: 'project',
        metadata: projectToItemMetadata({
          description,
          icon: icon || '📚',
          color: color || '#a78bfa',
          status: 'planning',
          progress: 0,
        }),
        orderIndex: projects.length,
      });

      toast({
        title: "✅ Projet créé",
        description: `${name} a été créé avec succès`,
      });

      await rewardProjectCreation(name);

      return itemToProject(newItem);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet",
        variant: "destructive"
      });
      return null;
    }
  }, [createItem, projects.length, toast, rewardProjectCreation]);

  // Update project
  const updateProject = useCallback(async (
    projectId: string,
    updates: Partial<Project>
  ) => {
    try {
      const item = items.find(i => i.id === projectId);
      if (!item) return false;

      await updateItem(projectId, {
        name: updates.name ?? item.name,
        metadata: { ...item.metadata, ...projectToItemMetadata(updates) },
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le projet",
        variant: "destructive"
      });
      return false;
    }
  }, [items, updateItem, toast]);

  // Delete project
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await deleteItem(projectId);
      
      toast({
        title: "🗑️ Projet supprimé",
        description: "Le projet a été supprimé avec succès",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet",
        variant: "destructive"
      });
      return false;
    }
  }, [deleteItem, toast]);

  // Complete project
  const completeProject = useCallback(async (projectId: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return false;

      await updateItem(projectId, {
        isCompleted: true,
        metadata: {
          ...items.find(i => i.id === projectId)?.metadata,
          status: 'completed',
          completedAt: new Date(),
        }
      });

      toast({
        title: "🎉 Projet complété !",
        description: "Félicitations pour avoir terminé ce projet",
      });

      // Count project tasks for gamification
      const projectTasks = items.filter(i => 
        i.contextType === 'project_task' && i.parentId === projectId
      );
      await rewardProjectCompletion(projectId, project.name, projectTasks.length);

      return true;
    } catch (error: any) {
      return false;
    }
  }, [projects, items, updateItem, toast, rewardProjectCompletion]);

  // Assign task to project
  const assignTaskToProject = useCallback(async (
    taskId: string,
    projectId: string | null
  ) => {
    try {
      await updateItem(taskId, {
        parentId: projectId,
        contextType: projectId ? 'project_task' : 'task',
        metadata: {
          projectId: projectId || undefined,
          projectStatus: projectId ? 'todo' : undefined,
        }
      });
      return true;
    } catch (error: any) {
      return false;
    }
  }, [updateItem]);

  return {
    projects,
    loading,
    activeProjects,
    createProject,
    updateProject,
    deleteProject,
    completeProject,
    assignTaskToProject,
    reloadProjects: reload
  };
};
