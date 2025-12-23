// ============= Context Schemas =============
// Defines the required/optional fields and validation rules for each context type

import { ItemContextType, ItemMetadata } from '@/types/item';

// ============= Schema Definition =============
export interface ContextSchema {
  // Fields that MUST be present for this context
  requiredFields: (keyof ItemMetadata)[];
  
  // Fields that are optional but recognized
  optionalFields: (keyof ItemMetadata)[];
  
  // Default values for required fields when creating or transforming
  defaultValues: Partial<ItemMetadata>;
  
  // Whether this context type can have child items
  canHaveChildren: boolean;
  
  // What context types can be parents of this type
  allowedParentTypes: ItemContextType[];
  
  // What context types can be children of this type
  allowedChildTypes: ItemContextType[];
  
  // Human-readable label
  label: string;
  
  // Icon for UI
  icon: string;
}

// ============= Context Schemas =============
export const CONTEXT_SCHEMAS: Record<ItemContextType, ContextSchema> = {
  task: {
    requiredFields: ['category', 'context', 'estimatedTime'],
    optionalFields: ['subCategory', 'duration', 'level', 'isExpanded', 'projectId', 'projectStatus'],
    defaultValues: {
      category: 'Autres',
      context: 'Perso',
      estimatedTime: 30,
      level: 0,
      isExpanded: false
    },
    canHaveChildren: true,
    allowedParentTypes: ['project'],
    allowedChildTypes: ['subtask'],
    label: 'Tâche',
    icon: '✓'
  },
  
  subtask: {
    requiredFields: ['category', 'context', 'estimatedTime'],
    optionalFields: ['subCategory', 'duration', 'level', 'isExpanded'],
    defaultValues: {
      category: 'Autres',
      context: 'Perso',
      estimatedTime: 15,
      level: 1,
      isExpanded: false
    },
    canHaveChildren: true,
    allowedParentTypes: ['task', 'subtask'],
    allowedChildTypes: ['subtask'],
    label: 'Sous-tâche',
    icon: '◦'
  },
  
  project: {
    requiredFields: ['color', 'status'],
    optionalFields: ['description', 'icon', 'targetDate', 'progress', 'completedAt'],
    defaultValues: {
      color: '#a78bfa',
      status: 'planning',
      progress: 0
    },
    canHaveChildren: true,
    allowedParentTypes: [],
    allowedChildTypes: ['project_task', 'task'],
    label: 'Projet',
    icon: '📁'
  },
  
  project_task: {
    requiredFields: ['category', 'context', 'estimatedTime', 'projectStatus'],
    optionalFields: ['subCategory', 'duration'],
    defaultValues: {
      category: 'Autres',
      context: 'Perso',
      estimatedTime: 30,
      projectStatus: 'todo'
    },
    canHaveChildren: true,
    allowedParentTypes: ['project'],
    allowedChildTypes: ['subtask'],
    label: 'Tâche de projet',
    icon: '📋'
  },
  
  habit: {
    requiredFields: ['deckId', 'frequency', 'isActive'],
    optionalFields: [
      'description', 'timesPerWeek', 'timesPerMonth', 'targetDays',
      'icon', 'color', 'isChallenge', 'challengeStartDate', 'challengeEndDate',
      'challengeDurationDays', 'challengeEndAction', 'isLocked', 'unlockCondition'
    ],
    defaultValues: {
      frequency: 'daily',
      isActive: true,
      isChallenge: false,
      isLocked: false
    },
    canHaveChildren: false,
    allowedParentTypes: ['deck'],
    allowedChildTypes: [],
    label: 'Habitude',
    icon: '🔄'
  },
  
  deck: {
    requiredFields: ['color', 'isDefault'],
    optionalFields: ['description', 'icon', 'isProgressionDeck'],
    defaultValues: {
      color: '#10b981',
      isDefault: false,
      isProgressionDeck: false
    },
    canHaveChildren: true,
    allowedParentTypes: [],
    allowedChildTypes: ['habit'],
    label: 'Deck',
    icon: '🎴'
  },
  
  team_task: {
    requiredFields: ['category', 'context', 'estimatedTime', 'teamId'],
    optionalFields: ['subCategory', 'duration', 'assignedTo', 'level', 'isExpanded'],
    defaultValues: {
      category: 'Autres',
      context: 'Pro',
      estimatedTime: 30,
      level: 0,
      isExpanded: false
    },
    canHaveChildren: true,
    allowedParentTypes: [],
    allowedChildTypes: ['subtask'],
    label: 'Tâche d\'équipe',
    icon: '👥'
  }
};

// ============= Validation Helpers =============

/**
 * Get missing required fields for a context type
 */
export function getMissingRequiredFields(
  contextType: ItemContextType,
  metadata: Partial<ItemMetadata>
): (keyof ItemMetadata)[] {
  const schema = CONTEXT_SCHEMAS[contextType];
  return schema.requiredFields.filter(field => {
    const value = metadata[field];
    return value === undefined || value === null || value === '';
  });
}

/**
 * Validate if metadata is complete for a context type
 */
export function isMetadataValid(
  contextType: ItemContextType,
  metadata: Partial<ItemMetadata>
): boolean {
  return getMissingRequiredFields(contextType, metadata).length === 0;
}

/**
 * Get default metadata for a context type
 */
export function getDefaultMetadata(contextType: ItemContextType): Partial<ItemMetadata> {
  return { ...CONTEXT_SCHEMAS[contextType].defaultValues };
}

/**
 * Check if a context transformation is valid
 */
export function canTransformContext(
  fromContext: ItemContextType,
  toContext: ItemContextType,
  hasParent: boolean,
  hasChildren: boolean
): { valid: boolean; reason?: string } {
  const toSchema = CONTEXT_SCHEMAS[toContext];
  
  // Check if the new context can have children if item has children
  if (hasChildren && !toSchema.canHaveChildren) {
    return {
      valid: false,
      reason: `${toSchema.label} ne peut pas avoir d'enfants`
    };
  }
  
  // Check if the new context can have a parent if item has parent
  if (hasParent && toSchema.allowedParentTypes.length === 0) {
    return {
      valid: false,
      reason: `${toSchema.label} ne peut pas avoir de parent`
    };
  }
  
  return { valid: true };
}

/**
 * Get the field configuration for UI rendering
 */
export interface FieldConfig {
  key: keyof ItemMetadata;
  label: string;
  type: 'text' | 'number' | 'select' | 'color' | 'date' | 'boolean' | 'array';
  options?: { value: string | number; label: string }[];
  required: boolean;
}

export function getFieldConfigs(contextType: ItemContextType): FieldConfig[] {
  const configs: Record<keyof ItemMetadata, Omit<FieldConfig, 'key' | 'required'>> = {
    category: {
      label: 'Catégorie',
      type: 'select',
      options: [
        { value: 'Obligation', label: 'Cruciales' },
        { value: 'Quotidien', label: 'Régulières' },
        { value: 'Envie', label: 'Envies' },
        { value: 'Autres', label: 'Optionnelles' }
      ]
    },
    subCategory: {
      label: 'Priorité',
      type: 'select',
      options: [
        { value: 'Le plus important', label: 'Le plus important' },
        { value: 'Important', label: 'Important' },
        { value: 'Peut attendre', label: 'Peut attendre' },
        { value: 'Si j\'ai le temps', label: 'Si j\'ai le temps' }
      ]
    },
    context: {
      label: 'Contexte',
      type: 'select',
      options: [
        { value: 'Pro', label: 'Pro' },
        { value: 'Perso', label: 'Perso' }
      ]
    },
    estimatedTime: {
      label: 'Durée estimée (min)',
      type: 'number'
    },
    duration: {
      label: 'Durée réelle (min)',
      type: 'number'
    },
    description: {
      label: 'Description',
      type: 'text'
    },
    icon: {
      label: 'Icône',
      type: 'text'
    },
    color: {
      label: 'Couleur',
      type: 'color'
    },
    status: {
      label: 'Statut',
      type: 'select',
      options: [
        { value: 'planning', label: 'Planification' },
        { value: 'in-progress', label: 'En cours' },
        { value: 'on-hold', label: 'En pause' },
        { value: 'completed', label: 'Terminé' },
        { value: 'archived', label: 'Archivé' }
      ]
    },
    projectStatus: {
      label: 'Statut de tâche',
      type: 'select',
      options: [
        { value: 'todo', label: 'À faire' },
        { value: 'in-progress', label: 'En cours' },
        { value: 'done', label: 'Terminé' }
      ]
    },
    targetDate: {
      label: 'Date cible',
      type: 'date'
    },
    progress: {
      label: 'Progression (%)',
      type: 'number'
    },
    frequency: {
      label: 'Fréquence',
      type: 'select',
      options: [
        { value: 'daily', label: 'Quotidien' },
        { value: 'weekly', label: 'Hebdomadaire' },
        { value: 'x-times-per-week', label: 'X fois/semaine' },
        { value: 'monthly', label: 'Mensuel' },
        { value: 'x-times-per-month', label: 'X fois/mois' },
        { value: 'custom', label: 'Personnalisé' }
      ]
    },
    isActive: {
      label: 'Actif',
      type: 'boolean'
    },
    isDefault: {
      label: 'Par défaut',
      type: 'boolean'
    },
    teamId: {
      label: 'Équipe',
      type: 'text'
    },
    // Add more as needed...
  } as Record<keyof ItemMetadata, Omit<FieldConfig, 'key' | 'required'>>;

  const schema = CONTEXT_SCHEMAS[contextType];
  const allFields = [...schema.requiredFields, ...schema.optionalFields];
  
  return allFields
    .filter(field => configs[field])
    .map(field => ({
      key: field,
      ...configs[field],
      required: schema.requiredFields.includes(field)
    }));
}
