import { TaskCategory, TaskContext, SubTaskCategory } from '@/types/task';

export type TaskType = 'personal' | 'project' | 'team';

export interface TaskTypeConfig {
  // Champs à afficher
  showContextSelector: boolean;      // Pro/Perso
  showCategorySelector: boolean;     // Cruciale, Envie, etc.
  showPrioritySelector: boolean;     // Le plus important, Important...
  showScheduling: boolean;           // Date/heure
  showRecurrence: boolean;           // Récurrence
  showAssignment: boolean;           // Assignation (équipe)
  showMultipleTasks: boolean;        // Ajout multiple de tâches
  
  // Labels personnalisés
  labels: {
    title: string;
    editTitle: string;
    submitButton: string;
    submitMultipleButton: (count: number) => string;
  };
  
  // Valeurs par défaut
  defaults: {
    context?: TaskContext;
    category?: TaskCategory;
    subCategory?: SubTaskCategory;
  };
  
  // Champs requis pour validation
  requiredFields: ('name' | 'context' | 'category' | 'subCategory' | 'estimatedTime')[];
}

export const TASK_TYPE_CONFIGS: Record<TaskType, TaskTypeConfig> = {
  personal: {
    showContextSelector: true,
    showCategorySelector: true,
    showPrioritySelector: true,
    showScheduling: true,
    showRecurrence: true,
    showAssignment: false,
    showMultipleTasks: true,
    labels: {
      title: 'Nouvelle(s) tâche(s)',
      editTitle: 'Modifier la tâche',
      submitButton: 'Créer la tâche',
      submitMultipleButton: (count) => `Créer ${count} tâches`
    },
    defaults: {},
    requiredFields: ['name', 'context', 'category', 'estimatedTime']
  },
  project: {
    showContextSelector: false,  // Pas de Pro/Perso pour les projets
    showCategorySelector: false, // Pas de catégories personnelles
    showPrioritySelector: true,  // Priorité utile
    showScheduling: true,
    showRecurrence: false,       // Projets rarement récurrents
    showAssignment: false,
    showMultipleTasks: true,
    labels: {
      title: 'Nouvelle tâche de projet',
      editTitle: 'Modifier la tâche',
      submitButton: 'Ajouter au projet',
      submitMultipleButton: (count) => `Ajouter ${count} tâches`
    },
    defaults: {
      context: 'Pro',           // Défaut Pro pour les projets
      category: 'Quotidien'     // Catégorie neutre par défaut
    },
    requiredFields: ['name', 'estimatedTime']
  },
  team: {
    showContextSelector: false,  // Pas de Pro/Perso pour les équipes
    showCategorySelector: false, // Pas de catégories personnelles
    showPrioritySelector: true,  // Priorité utile
    showScheduling: true,
    showRecurrence: false,
    showAssignment: true,        // Qui fait quoi
    showMultipleTasks: false,    // Une tâche à la fois pour assignation
    labels: {
      title: 'Nouvelle tâche d\'équipe',
      editTitle: 'Modifier la tâche',
      submitButton: 'Créer la tâche',
      submitMultipleButton: (count) => `Créer ${count} tâches`
    },
    defaults: {
      context: 'Pro',
      category: 'Quotidien'
    },
    requiredFields: ['name', 'estimatedTime']
  }
};

/**
 * Obtenir la configuration pour un type de tâche
 */
export function getTaskTypeConfig(taskType: TaskType): TaskTypeConfig {
  return TASK_TYPE_CONFIGS[taskType];
}
