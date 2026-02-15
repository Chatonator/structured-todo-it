// ============= Item Converters =============
// Centralized conversion functions from Item to domain entities
// SINGLE SOURCE OF TRUTH for Item -> Task conversion

import { Item } from '@/types/item';
import { Task } from '@/types/task';

/**
 * Convert Item to Task for backward compatibility
 * UNIFIED CONVERTER - used by useTasks, useProjectTasks, useAllProjectTasks
 * 
 * projectId logic:
 * - For 'project_task': use item.parentId (the project reference)
 * - For regular 'task': use metadata.projectId if it exists (legacy support)
 * - For 'subtask': projectId is inherited from parent task via metadata
 */
export function itemToTask(item: Item): Task {
  const meta = item.metadata || {};
  const isProjectTask = item.contextType === 'project_task';
  
  // Determine projectId based on context type
  // project_task: parentId IS the projectId
  // task/subtask: check metadata for legacy projectId
  const projectId = isProjectTask 
    ? (item.parentId || undefined)
    : (meta.projectId as string | undefined);

  // Determine projectStatus - only relevant for project tasks
  const projectStatus = isProjectTask
    ? ((meta.projectStatus as Task['projectStatus']) || 'todo')
    : (meta.projectStatus as Task['projectStatus']);
  
  return {
    id: item.id,
    name: item.name,
    category: (meta.category as Task['category']) || 'Autres',
    subCategory: meta.subCategory as Task['subCategory'],
    context: (meta.context as Task['context']) || 'Perso',
    estimatedTime: (meta.estimatedTime as number) || 30,
    duration: meta.duration as number | undefined,
    level: (meta.level as Task['level']) || 0,
    // For subtasks, parentId is the parent task ID (not the project)
    parentId: !isProjectTask ? (item.parentId || undefined) : undefined,
    isCompleted: item.isCompleted,
    isExpanded: (meta.isExpanded as boolean) ?? true,
    createdAt: item.createdAt,
    projectId,
    projectStatus,
    isImportant: meta.isImportant as boolean | undefined,
    isUrgent: meta.isUrgent as boolean | undefined,
  };
}
