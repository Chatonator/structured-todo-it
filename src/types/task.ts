
export type TaskCategory = 'Obligation' | 'Quotidien' | 'Envie' | 'Autres';
export type SubTaskCategory = 'Le plus important' | 'Important' | 'Peut attendre' | 'Si j\'ai le temps';
export type TaskContext = 'Pro' | 'Perso';

export interface Task {
  id: string;
  name: string;
  category: TaskCategory;
  subCategory?: SubTaskCategory;
  context: TaskContext; // Nouveau champ obligatoire
  estimatedTime: number;
  createdAt: Date;
  parentId?: string;
  level: 0 | 1 | 2;
  isExpanded: boolean;
  isCompleted: boolean;
}

export const CATEGORY_CONFIG = {
  'Obligation': {
    color: 'bg-category-obligation-light text-category-obligation border-category-obligation',
    borderPattern: 'border-l-4 border-l-category-obligation',
    cssColor: 'hsl(var(--theme-obligation))',
    eisenhowerQuadrant: 'urgent-important' as const
  },
  'Quotidien': {
    color: 'bg-category-quotidien-light text-category-quotidien border-category-quotidien',
    borderPattern: 'border-l-4 border-l-category-quotidien',
    cssColor: 'hsl(var(--theme-quotidien))',
    eisenhowerQuadrant: 'urgent-not-important' as const
  },
  'Envie': {
    color: 'bg-category-envie-light text-category-envie border-category-envie',
    borderPattern: 'border-l-4 border-l-category-envie',
    cssColor: 'hsl(var(--theme-envie))',
    eisenhowerQuadrant: 'not-urgent-important' as const
  },
  'Autres': {
    color: 'bg-category-autres-light text-category-autres border-category-autres',
    borderPattern: 'border-l-4 border-l-category-autres',
    cssColor: 'hsl(var(--theme-autres))',
    eisenhowerQuadrant: 'not-urgent-not-important' as const
  }
} as const;

export const SUB_CATEGORY_CONFIG = {
  'Le plus important': {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    colorDark: 'bg-purple-800 text-purple-100',
    pattern: 'border-l-4 border-l-purple-500',
    priority: 4
  },
  'Important': {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    colorDark: 'bg-blue-800 text-blue-100',
    pattern: 'border-l-4 border-l-blue-500',
    priority: 3
  },
  'Peut attendre': {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    colorDark: 'bg-yellow-800 text-yellow-100',
    pattern: 'border-l-4 border-l-yellow-500',
    priority: 2
  },
  'Si j\'ai le temps': {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    colorDark: 'bg-gray-800 text-gray-100',
    pattern: 'border-l-4 border-l-gray-500',
    priority: 1
  }
} as const;

export const CONTEXT_CONFIG = {
  'Pro': {
    label: '💼 Pro',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    colorDark: 'bg-blue-800 text-blue-100'
  },
  'Perso': {
    label: '🏠 Perso',
    color: 'bg-green-100 text-green-800 border-green-200',
    colorDark: 'bg-green-800 text-green-100'
  }
} as const;

export const TASK_LEVELS = {
  0: { symbol: '●', bgColor: 'bg-white', textSize: 'text-sm' },
  1: { symbol: '◦', bgColor: 'bg-gray-50', textSize: 'text-xs' },
  2: { symbol: '▫', bgColor: 'bg-gray-100', textSize: 'text-xs' }
} as const;

export const TIME_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2h' },
  { value: 180, label: '3h' },
  { value: 240, label: '4h' },
  { value: 300, label: '5h' },
  { value: 360, label: '6h' },
  { value: 480, label: '8h' }
];
