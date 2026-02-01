import { TaskType, TaskTypeConfig, TASK_TYPE_CONFIGS } from '@/config/taskTypeConfig';
import { TaskCategory, TaskContext, SubTaskCategory } from '@/types/task';

export interface TaskDraft {
  name: string;
  category: TaskCategory | '';
  subCategory: SubTaskCategory | '';
  context: TaskContext | '';
  estimatedTime: number | '';
  scheduledDate?: Date;
  scheduledTime?: string;
  isRecurring?: boolean;
  recurrenceInterval?: string;
  assignedTo?: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valider une tâche selon son type
 */
export function validateTaskByType(
  draft: TaskDraft,
  taskType: TaskType,
  isSubTask: boolean = false
): ValidationResult {
  const config = TASK_TYPE_CONFIGS[taskType];
  const errors: string[] = [];

  // Validation du nom (toujours requis)
  if (!draft.name.trim()) {
    errors.push('Le nom est requis');
  }

  // Validation du temps estimé (toujours requis)
  if (draft.estimatedTime === '' || Number(draft.estimatedTime) <= 0) {
    errors.push('Le temps estimé est requis');
  }

  // Validation du contexte (si affiché et requis)
  if (config.showContextSelector && config.requiredFields.includes('context')) {
    if (!draft.context) {
      errors.push('Le contexte est requis');
    }
  }

  // Validation de la catégorie (si affiché et requis)
  if (config.showCategorySelector && config.requiredFields.includes('category')) {
    if (!draft.category) {
      errors.push('La catégorie est requise');
    }
  }

  // Validation de la priorité pour les sous-tâches (toujours requise)
  // ou si explicitement requise dans requiredFields
  if (config.showPrioritySelector && config.requiredFields.includes('subCategory')) {
    if (!draft.subCategory) {
      errors.push('La priorité est requise');
    }
  } else if (isSubTask && config.showPrioritySelector) {
    if (!draft.subCategory) {
      errors.push('La priorité est requise pour les sous-tâches');
    }
  }

  // Validation de la planification (date et heure doivent être ensemble)
  if (draft.scheduledDate && !draft.scheduledTime) {
    errors.push('L\'heure est requise si une date est définie');
  }
  if (!draft.scheduledDate && draft.scheduledTime) {
    errors.push('La date est requise si une heure est définie');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Vérifier si une tâche est valide (version simplifiée pour UI)
 */
export function isTaskDraftValid(
  draft: TaskDraft,
  taskType: TaskType,
  isSubTask: boolean = false
): boolean {
  return validateTaskByType(draft, taskType, isSubTask).isValid;
}

/**
 * Obtenir les valeurs par défaut pour un type de tâche
 */
export function getDefaultsForTaskType(taskType: TaskType): Partial<TaskDraft> {
  const config = TASK_TYPE_CONFIGS[taskType];
  return {
    context: config.defaults.context || '',
    category: config.defaults.category || '',
    subCategory: config.defaults.subCategory || ''
  };
}
