
export interface Task {
  id: string;
  name: string;
  category: 'Obligation' | 'Envie' | 'Quotidien' | 'Autres';
  subCategory?: 'Le plus important' | 'Important' | 'Normal' | 'Optionnel'; // Pour sous-tâches uniquement
  estimatedTime: number; // en minutes
  createdAt: Date;
  parentId?: string; // ID de la tâche parente si c'est une sous-tâche
  level: 0 | 1 | 2; // 0: tâche, 1: sous-tâche, 2: sous-sous-tâche
  isExpanded?: boolean; // pour replier/déplier les sous-tâches
  isCompleted?: boolean; // statut terminée
}

export type TaskCategory = Task['category'];
export type SubTaskCategory = Task['subCategory'];

// Configuration des durées disponibles
export const TIME_OPTIONS = [
  { value: 2, label: '2 min' },
  { value: 5, label: '5 min' },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1) * 10,
    label: `${(i + 1) * 10} min`
  }))
];

// Configuration des catégories principales avec couleurs, icônes et motifs pour l'accessibilité
export const CATEGORY_CONFIG = {
  Obligation: {
    color: 'bg-red-100 text-red-800 border-red-200',
    colorDark: 'bg-red-800 text-red-100',
    icon: '🔥',
    pattern: 'border-l-4 border-l-red-500',
    shape: 'rounded-none',
    eisenhowerQuadrant: 'urgent-important'
  },
  Envie: {
    color: 'bg-green-100 text-green-800 border-green-200',
    colorDark: 'bg-green-800 text-green-100',
    icon: '💚',
    pattern: 'border-l-4 border-l-green-500',
    shape: 'rounded-full',
    eisenhowerQuadrant: 'important-not-urgent'
  },
  Quotidien: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    colorDark: 'bg-blue-800 text-blue-100',
    icon: '📅',
    pattern: 'border-l-4 border-l-blue-500',
    shape: 'rounded-md',
    eisenhowerQuadrant: 'urgent-not-important'
  },
  Autres: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    colorDark: 'bg-gray-800 text-gray-100',
    icon: '📝',
    pattern: 'border-l-4 border-l-gray-500',
    shape: 'rounded-lg',
    eisenhowerQuadrant: 'not-urgent-not-important'
  }
} as const;

// Configuration des sous-catégories (pour sous-tâches et sous-sous-tâches)
export const SUB_CATEGORY_CONFIG = {
  'Le plus important': {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    colorDark: 'bg-purple-800 text-purple-100',
    icon: '⭐',
    pattern: 'border-l-4 border-l-purple-500',
    shape: 'rounded-none',
    priority: 4
  },
  'Important': {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    colorDark: 'bg-yellow-800 text-yellow-100',
    icon: '➕',
    pattern: 'border-l-4 border-l-yellow-500',
    shape: 'rounded-md',
    priority: 3
  },
  'Normal': {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    colorDark: 'bg-orange-800 text-orange-100',
    icon: '🔗',
    pattern: 'border-l-4 border-l-orange-500',
    shape: 'rounded-lg',
    priority: 2
  },
  'Optionnel': {
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    colorDark: 'bg-cyan-800 text-cyan-100',
    icon: '⚙️',
    pattern: 'border-l-4 border-l-cyan-500',
    shape: 'rounded-full',
    priority: 1
  }
} as const;

// Configuration des niveaux de tâches
export const TASK_LEVELS = {
  0: { symbol: '•', bgColor: 'bg-white', indent: 'ml-0' },
  1: { symbol: '◦', bgColor: 'bg-gray-50', indent: 'ml-6' },
  2: { symbol: '▫', bgColor: 'bg-gray-100', indent: 'ml-12' }
} as const;

// Utilitaires de formatage
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
};

export const formatHours = (minutes: number): string => {
  return `${(minutes / 60).toFixed(1)}h`;
};
