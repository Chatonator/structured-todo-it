// ============= Projects Hook (unified items wrapper) =============
// This hook wraps useItems to provide backward-compatible Project operations
// All data is now stored in the unified 'items' table

import { useCallback, useMemo } from 'react';
import { useItems } from './useItems';
import { useToast } from './use-toast';
import { Project, ProjectStatus } from '@/types/project';
import { Item, ItemMetadata, KanbanColumnConfig } from '@/types/item';
import { supabase } from '@/integrations/supabase/client';

// Extended Project type with kanban columns
export interface ProjectWithKanban extends Project {
  showInSidebar?: boolean;
  kanbanColumns?: KanbanColumnConfig[];
}

// Convert Item to Project for backward compatibility
function itemToProject(item: Item): ProjectWithKanban {
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
    showInSidebar: (meta.showInSidebar as boolean) || false,
    kanbanColumns: meta.kanbanColumns as KanbanColumnConfig[] | undefined,
  };
}

// Convert Project to Item metadata - only includes defined properties to avoid undefined overwriting defaults
function projectToItemMetadata(
  project: Partial<ProjectWithKanban>,
  context?: string,
  isImportant?: boolean,
  isUrgent?: boolean
): Partial<ItemMetadata> {
  const metadata: Partial<ItemMetadata> = {
    // Required harmonized fields
    category: 'low_priority' as any,
    context: (context as any) || 'Perso',
    estimatedTime: 60,
    isImportant: isImportant ?? false,
    isUrgent: isUrgent ?? false,
  };
  
  // Required project fields - always with defaults
  metadata.color = project.color || '#a78bfa';
  metadata.status = project.status || 'planning';
  
  // Optional fields - only include if defined
  if (project.description !== undefined) metadata.description = project.description;
  if (project.icon !== undefined) metadata.icon = project.icon;
  if (project.targetDate !== undefined) metadata.targetDate = project.targetDate;
  if (project.progress !== undefined) metadata.progress = project.progress;
  if (project.completedAt !== undefined) metadata.completedAt = project.completedAt;
  if (project.showInSidebar !== undefined) metadata.showInSidebar = project.showInSidebar;
  if (project.kanbanColumns !== undefined) metadata.kanbanColumns = project.kanbanColumns;
  
  return metadata;
}

export const useProjects = (enabled = true) => {
  const { 
    items, 
    loading, 
    createItem, 
    updateItem, 
    deleteItem,
    reload 
  } = useItems({ contextTypes: ['project'], enabled });
  
  const { toast } = useToast();

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
    color?: string,
    context?: string,
    isImportant?: boolean,
    isUrgent?: boolean
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
        }, context, isImportant, isUrgent),
        orderIndex: projects.length,
      });

      toast({
        title: "✅ Projet créé",
        description: `${name} a été créé avec succès`,
      });

      return itemToProject(newItem);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet",
        variant: "destructive"
      });
      return null;
    }
  }, [createItem, projects.length, toast]);

  // Update project
  const updateProject = useCallback(async (
    projectId: string,
    updates: Partial<ProjectWithKanban>
  ) => {
    try {
      const item = items.find(i => i.id === projectId);
      if (!item) return false;

      // Build metadata updates properly, only including fields that are being updated
      const metadataUpdates: Record<string, unknown> = {};
      
      if (updates.description !== undefined) metadataUpdates.description = updates.description;
      if (updates.icon !== undefined) metadataUpdates.icon = updates.icon;
      if (updates.color !== undefined) metadataUpdates.color = updates.color;
      if (updates.status !== undefined) metadataUpdates.status = updates.status;
      if (updates.targetDate !== undefined) metadataUpdates.targetDate = updates.targetDate;
      if (updates.progress !== undefined) metadataUpdates.progress = updates.progress;
      if (updates.completedAt !== undefined) metadataUpdates.completedAt = updates.completedAt;
      if (updates.showInSidebar !== undefined) metadataUpdates.showInSidebar = updates.showInSidebar;
      if (updates.kanbanColumns !== undefined) metadataUpdates.kanbanColumns = updates.kanbanColumns;

      await updateItem(projectId, {
        name: updates.name ?? item.name,
        metadata: { ...item.metadata, ...metadataUpdates },
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

      return true;
    } catch (error: any) {
      return false;
    }
  }, [projects, items, updateItem, toast]);

  // Assign task to project (preserves existing metadata like subCategory)
  // SECURED: Validates DB state before mutation to prevent duplications
  const assignTaskToProject = useCallback(async (
    taskId: string,
    projectId: string | null,
    existingMetadata?: Record<string, unknown>
  ) => {
    try {
      // GUARD: Check current state in DB to prevent redundant mutations
      const { data: currentItem, error: fetchError } = await supabase
        .from('items')
        .select('parent_id, item_type, metadata')
        .eq('id', taskId)
        .single();
      
      if (fetchError) {
        console.error('Failed to fetch task state:', fetchError);
        return false;
      }
      
      // Skip if already in the target project (or already not in a project)
      if (currentItem?.parent_id === projectId) {
        console.log('Task already in target project, skipping mutation');
        return true;
      }
      
      // Merge existing metadata with new project-specific fields
      const mergedMetadata: Partial<ItemMetadata> = {
        ...existingMetadata,
        // Clear projectId from metadata for project_task (parentId is the source of truth)
        projectId: projectId ? undefined : undefined,
        projectStatus: projectId ? 'todo' as const : undefined,
      };
      
      await updateItem(taskId, {
        parentId: projectId,
        contextType: projectId ? 'project_task' : 'task',
        metadata: mergedMetadata
      });
      return true;
    } catch (error: any) {
      console.error('assignTaskToProject error:', error);
      return false;
    }
  }, [updateItem]);

  // Create project from an existing task (with its subtasks)
  // subTasks should include full metadata to preserve priority (subCategory)
  const createProjectFromTask = useCallback(async (
    taskId: string,
    taskName: string,
    subTasks: { id: string; name: string; metadata?: Record<string, unknown> }[],
    projectData?: { description?: string; icon?: string; color?: string }
  ) => {
    try {
      // 1. Create the project
      const project = await createProject(
        projectData?.description ? `${taskName}` : taskName,
        projectData?.description,
        projectData?.icon || '📁',
        projectData?.color || '#a78bfa'
      );

      if (!project) {
        toast({
          title: "Erreur",
          description: "Impossible de créer le projet",
          variant: "destructive"
        });
        return null;
      }

      // 2. Assign all subtasks to the new project, preserving their metadata
      for (const subTask of subTasks) {
        await assignTaskToProject(subTask.id, project.id, subTask.metadata);
      }

      // 3. Archive the original task (mark as completed)
      await updateItem(taskId, {
        isCompleted: true,
        metadata: {
          archivedToProject: project.id,
          archivedAt: new Date()
        }
      });

      toast({
        title: "🎉 Projet créé !",
        description: `"${taskName}" a été converti en projet avec ${subTasks.length} tâche(s)`,
      });

      return project;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet depuis la tâche",
        variant: "destructive"
      });
      return null;
    }
  }, [createProject, assignTaskToProject, updateItem, toast]);

  return {
    projects,
    loading,
    activeProjects,
    createProject,
    updateProject,
    deleteProject,
    completeProject,
    assignTaskToProject,
    createProjectFromTask,
    reloadProjects: reload
  };
};
