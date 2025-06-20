
export interface Task {
  id: string;
  name: string;
  category: 'Obligation' | 'Envie' | 'Quotidien' | 'Autres';
  estimatedTime: number; // en minutes
  createdAt: Date;
  parentId?: string; // ID de la tâche parente si c'est une sous-tâche
  level: 0 | 1 | 2; // 0: tâche, 1: sous-tâche, 2: sous-sous-tâche
  isExpanded?: boolean; // pour replier/déplier les sous-tâches
}

export type TaskCategory = Task['category'];

// Configuration des durées disponibles
export const TIME_OPTIONS = [
  { value: 2, label: '2 min' },
  { value: 5, label: '5 min' },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1) * 10,
    label: `${(i + 1) * 10} min`
  }))
];

// Configuration des catégories avec couleurs, icônes et motifs pour l'accessibilité
export const CATEGORY_CONFIG = {
  Obligation: {
    color: 'bg-red-100 text-red-800 border-red-200',
    colorDark: 'bg-red-800 text-red-100',
    icon: '🔥',
    pattern: 'border-l-4 border-l-red-500',
    shape: 'rounded-none'
  },
  Envie: {
    color: 'bg-green-100 text-green-800 border-green-200',
    colorDark: 'bg-green-800 text-green-100',
    icon: '💚',
    pattern: 'border-l-4 border-l-green-500',
    shape: 'rounded-full'
  },
  Quotidien: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    colorDark: 'bg-blue-800 text-blue-100',
    icon: '📅',
    pattern: 'border-l-4 border-l-blue-500',
    shape: 'rounded-md'
  },
  Autres: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    colorDark: 'bg-gray-800 text-gray-100',
    icon: '📝',
    pattern: 'border-l-4 border-l-gray-500',
    shape: 'rounded-lg'
  }
} as const;

// Configuration des niveaux de tâches
export const TASK_LEVELS = {
  0: { symbol: '•', bgColor: 'bg-white', indent: 'ml-0' },
  1: { symbol: '◦', bgColor: 'bg-gray-50', indent: 'ml-6' },
  2: { symbol: '▫', bgColor: 'bg-gray-100', indent: 'ml-12' }
} as const;
