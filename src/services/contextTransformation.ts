// ============= Context Transformation Service =============
// Handles transforming items between different context types
// Manages metadata validation and parent/child reorganization

import { Item, ItemContextType, ItemMetadata } from '@/types/item';
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
