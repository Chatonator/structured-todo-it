// ============= Context Transformation Service =============
// Handles transforming items between different context types
// Manages metadata validation and parent/child reorganization

import { Item, ItemContextType, ItemMetadata } from '@/types/item';
import { TaskCategory, TaskContext } from '@/types/task';
import { ProjectStatus } from '@/types/project';
import { 
  CONTEXT_SCHEMAS, 
  getMissingRequiredFields, 
  getDefaultMetadata,
  canTransformContext 
} from '@/config/contextSchemas';

// ============= Transformation Result =============
export interface TransformationResult {
  success: boolean;
  item?: Item;
  missingFields?: (keyof ItemMetadata)[];
  error?: string;
  childrenUpdates?: ChildTransformation[];
}

export interface ChildTransformation {
  childId: string;
  oldContextType: ItemContextType;
  newContextType: ItemContextType;
  newParentId: string;
}

// ============= Transformation Rules =============
// Define how children should be transformed when parent context changes
const CHILD_TRANSFORMATION_RULES: Record<string, {
  childFrom: ItemContextType;
  childTo: ItemContextType;
}[]> = {
  // Task -> Project: subtasks become project_tasks
  'task->project': [
    { childFrom: 'subtask', childTo: 'project_task' }
  ],
  // Project -> Task: project_tasks become subtasks
  'project->task': [
    { childFrom: 'project_task', childTo: 'subtask' },
    { childFrom: 'task', childTo: 'subtask' }
  ],
  // Deck -> Project: habits become project_tasks (if applicable)
  'deck->project': [
    { childFrom: 'habit', childTo: 'project_task' }
  ]
};

// ============= Main Transformation Function =============
export function transformItemContext(
  item: Item,
  newContextType: ItemContextType,
  additionalMetadata?: Partial<ItemMetadata>,
  children?: Item[]
): TransformationResult {
  
  // Check if transformation is valid
  const hasChildren = (children?.length ?? 0) > 0;
  const hasParent = item.parentId !== null;
  
  const validationResult = canTransformContext(
    item.contextType,
    newContextType,
    hasParent,
    hasChildren
  );
  
  if (!validationResult.valid) {
    return {
      success: false,
      error: validationResult.reason
    };
  }
  
  // Merge metadata: keep existing + add defaults for new context + override with provided
  const currentMetadata = item.metadata;
  const defaultMetadata = getDefaultMetadata(newContextType);
  const mergedMetadata: ItemMetadata = {
    ...currentMetadata,       // Keep all existing metadata (preserved)
    ...defaultMetadata,       // Add defaults for new context
    ...additionalMetadata     // Override with provided values
  };
  
  // Check for missing required fields
  const missingFields = getMissingRequiredFields(newContextType, mergedMetadata);
  
  if (missingFields.length > 0 && !additionalMetadata) {
    // Need more information from user
    return {
      success: false,
      missingFields,
      item: undefined
    };
  }
  
  // If we still have missing fields after additional metadata, return them
  const stillMissing = getMissingRequiredFields(newContextType, mergedMetadata);
  if (stillMissing.length > 0) {
    return {
      success: false,
      missingFields: stillMissing
    };
  }
  
  // Calculate children transformations
  const childrenUpdates: ChildTransformation[] = [];
  const transformKey = `${item.contextType}->${newContextType}`;
  const childRules = CHILD_TRANSFORMATION_RULES[transformKey] || [];
  
  if (children && childRules.length > 0) {
    for (const child of children) {
      const rule = childRules.find(r => r.childFrom === child.contextType);
      if (rule) {
        childrenUpdates.push({
          childId: child.id,
          oldContextType: child.contextType,
          newContextType: rule.childTo,
          newParentId: item.id
        });
      }
    }
  }
  
  // Create transformed item
  const transformedItem: Item = {
    ...item,
    contextType: newContextType,
    metadata: mergedMetadata,
    updatedAt: new Date(),
    // Clear parent if new context doesn't allow it
    parentId: CONTEXT_SCHEMAS[newContextType].allowedParentTypes.length === 0 
      ? null 
      : item.parentId
  };
  
  return {
    success: true,
    item: transformedItem,
    childrenUpdates
  };
}

// ============= Apply Children Transformations =============
export function applyChildTransformations(
  children: Item[],
  transformations: ChildTransformation[],
  metadataForContext?: Record<ItemContextType, Partial<ItemMetadata>>
): TransformationResult[] {
  const results: TransformationResult[] = [];
  
  for (const transformation of transformations) {
    const child = children.find(c => c.id === transformation.childId);
    if (!child) continue;
    
    const additionalMetadata = metadataForContext?.[transformation.newContextType];
    
    const result = transformItemContext(
      { ...child, parentId: transformation.newParentId },
      transformation.newContextType,
      additionalMetadata
    );
    
    results.push(result);
  }
  
  return results;
}

// ============= Common Transformation Scenarios =============

/**
 * Transform a task with subtasks into a project
 * - Task becomes Project
 * - Subtasks become Project Tasks
 */
export function taskToProject(
  task: Item,
  subtasks: Item[],
  projectMetadata: { color: string; status?: ProjectStatus; description?: string; icon?: string }
): TransformationResult {
  return transformItemContext(
    task,
    'project',
    {
      color: projectMetadata.color,
      status: projectMetadata.status || 'planning' as ProjectStatus,
      description: projectMetadata.description,
      icon: projectMetadata.icon,
      progress: 0
    },
    subtasks
  );
}

/**
 * Transform a project back into a task
 * - Project becomes Task
 * - Project Tasks become Subtasks
 */
export function projectToTask(
  project: Item,
  projectTasks: Item[],
  taskMetadata: { category: TaskCategory; context: TaskContext; estimatedTime: number }
): TransformationResult {
  return transformItemContext(
    project,
    'task',
    {
      category: taskMetadata.category,
      context: taskMetadata.context,
      estimatedTime: taskMetadata.estimatedTime,
      level: 0,
      isExpanded: true
    },
    projectTasks
  );
}

/**
 * Extract a subtask to become a standalone task
 */
export function subtaskToTask(subtask: Item): TransformationResult {
  return transformItemContext(
    { ...subtask, parentId: null },
    'task',
    {
      level: 0
    }
  );
}

/**
 * Attach a task as a subtask of another task
 */
export function taskToSubtask(
  task: Item,
  parentTaskId: string
): TransformationResult {
  return transformItemContext(
    { ...task, parentId: parentTaskId },
    'subtask',
    {
      level: 1
    }
  );
}

// ============= Validation Helpers =============

/**
 * Get a human-readable description of what will happen during transformation
 */
export function describeTransformation(
  item: Item,
  newContextType: ItemContextType,
  children?: Item[]
): string {
  const fromLabel = CONTEXT_SCHEMAS[item.contextType].label;
  const toLabel = CONTEXT_SCHEMAS[newContextType].label;
  
  let description = `Transformer \"${item.name}\" de ${fromLabel} en ${toLabel}`;
  
  if (children && children.length > 0) {
    const transformKey = `${item.contextType}->${newContextType}`;
    const childRules = CHILD_TRANSFORMATION_RULES[transformKey];
    
    if (childRules && childRules.length > 0) {
      const childFromLabel = CONTEXT_SCHEMAS[childRules[0].childFrom].label;
      const childToLabel = CONTEXT_SCHEMAS[childRules[0].childTo].label;
      description += `\n${children.length} ${childFromLabel}(s) deviendront des ${childToLabel}(s)`;
    }
  }
  
  return description;
}

/**
 * Check what fields would be missing for a transformation
 */
export function previewMissingFields(
  item: Item,
  newContextType: ItemContextType
): {
  field: keyof ItemMetadata;
  label: string;
  currentValue?: unknown;
}[] {
  const missingFields = getMissingRequiredFields(newContextType, item.metadata);
  
  return missingFields.map(field => ({
    field,
    label: getFieldLabel(field),
    currentValue: item.metadata[field]
  }));
}

function getFieldLabel(field: keyof ItemMetadata): string {
  const labels: Partial<Record<keyof ItemMetadata, string>> = {
    category: 'Catégorie',
    context: 'Contexte',
    estimatedTime: 'Durée estimée',
    color: 'Couleur',
    status: 'Statut',
    projectStatus: 'Statut de tâche',
    deckId: 'Deck',
    frequency: 'Fréquence',
    isActive: 'Actif',
    isDefault: 'Par défaut',
    teamId: 'Équipe'
  };
  
  return labels[field] || String(field);
}
