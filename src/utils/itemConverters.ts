// ============= Item Converters =============
// Centralized conversion functions from Item to domain entities

import { Item } from '@/types/item';
import { Task } from '@/types/task';

/**
 * Convert Item to Task for backward compatibility
 * Used by useProjectTasks and useAllProjectTasks
 */
export function itemToTask(item: Item): Task {
  const meta = item.metadata || {};
  return {
    id: item.id,
    name: item.name,
    category: (meta.category as Task['category']) || 'Autres',
    subCategory: meta.subCategory as Task['subCategory'],
    context: (meta.context as Task['context']) || 'Perso',
    estimatedTime: (meta.estimatedTime as number) || 30,
    duration: meta.duration as number | undefined,
    level: (meta.level as Task['level']) || 0,
    parentId: item.parentId || undefined,
    isCompleted: item.isCompleted,
    isExpanded: (meta.isExpanded as boolean) ?? true,
    createdAt: item.createdAt,
    // For project tasks, projectId is the parent_id
    projectId: item.parentId || undefined,
    projectStatus: (meta.projectStatus as Task['projectStatus']) || 'todo',
  };
}
