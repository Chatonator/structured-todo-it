
import { Task, TaskCategory, TaskContext, SubTaskCategory } from '@/types/task';
import { MAX_SUBTASK_DEPTH, MAX_CHILDREN_PER_TASK } from '@/lib/rewards/constants';

/**
 * Utilitaires de validation et nettoyage des tâches
 * Assure l'intégrité des données et évite les conflits
 */

/**
 * Vérifie si une sous-tâche peut être ajoutée
 */
export const canAddSubTask = (parentLevel: number, siblingCount: number): { allowed: boolean; reason?: string } => {
  if (parentLevel >= MAX_SUBTASK_DEPTH) {
    return { allowed: false, reason: `Profondeur maximale atteinte (${MAX_SUBTASK_DEPTH} niveaux)` };
  }
  if (siblingCount >= MAX_CHILDREN_PER_TASK) {
    return { allowed: false, reason: `Maximum ${MAX_CHILDREN_PER_TASK} sous-tâches atteint` };
  }
  return { allowed: true };
};

/**
 * Valide qu'une tâche respecte les contraintes métier
 */
export const validateTask = (task: Partial<Task>): string[] => {
  const errors: string[] = [];

  if (!task.name || task.name.trim().length === 0) {
    errors.push('Le nom de la tâche est requis');
  }

  if (!task.category) {
    errors.push('La catégorie est requise');
  }

  if (!task.context) {
    errors.push('Le contexte est requis');
  }

  if (!task.estimatedTime || task.estimatedTime <= 0) {
    errors.push('Le temps estimé doit être supérieur à 0');
  }

  if (task.level !== undefined && (task.level < 0 || task.level > 2)) {
    errors.push('Le niveau doit être entre 0 et 2');
  }

  return errors;
};

/**
 * Nettoie les données d'une tâche avant sauvegarde
 */
export const sanitizeTask = (task: Partial<Task>): Partial<Task> => {
  return {
    ...task,
    name: task.name?.trim(),
    estimatedTime: task.estimatedTime ? Math.max(1, task.estimatedTime) : undefined,
    level: task.level ?? 0,
    isExpanded: task.isExpanded ?? true,
    isCompleted: task.isCompleted ?? false
  };
};

/**
 * Vérifie la cohérence d'une liste de tâches
 */
export const validateTaskList = (tasks: Task[]): string[] => {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const task of tasks) {
    // Vérifier les IDs uniques
    if (ids.has(task.id)) {
      errors.push(`ID dupliqué détecté: ${task.id}`);
    }
    ids.add(task.id);

    // Vérifier les références parent
    if (task.parentId && !tasks.find(t => t.id === task.parentId)) {
      errors.push(`Parent inexistant pour la tâche ${task.id}: ${task.parentId}`);
    }

    // Vérifier la hiérarchie
    if (task.parentId) {
      const parent = tasks.find(t => t.id === task.parentId);
      if (parent && parent.level >= task.level) {
        errors.push(`Hiérarchie invalide pour la tâche ${task.id}`);
      }
    }
  }

  return errors;
};

/**
 * Répare automatiquement les problèmes de données détectés
 */
export const repairTaskList = (tasks: Task[]): Task[] => {
  const repairedTasks = [...tasks];
  const validIds = new Set(repairedTasks.map(t => t.id));

  return repairedTasks.map(task => {
    // Réparer les références parent cassées
    if (task.parentId && !validIds.has(task.parentId)) {
      console.warn(`Référence parent cassée réparée pour la tâche ${task.id}`);
      return { ...task, parentId: undefined, level: 0 };
    }

    // Assurer les valeurs par défaut
    return {
      ...task,
      level: task.level ?? 0,
      isExpanded: task.isExpanded ?? true,
      isCompleted: task.isCompleted ?? false,
      context: task.context || 'Perso' // Valeur par défaut sécurisée
    };
  });
};
