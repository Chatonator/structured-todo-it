
export interface Task {
  id: string;
  name: string;
  category: 'Obligation' | 'Envie' | 'Quotidien' | 'Autres';
  estimatedTime: number; // en minutes
  createdAt: Date;
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

// Configuration des catégories avec leurs couleurs
export const CATEGORY_CONFIG = {
  Obligation: {
    color: 'bg-red-100 text-red-800 border-red-200',
    colorDark: 'bg-red-800 text-red-100'
  },
  Envie: {
    color: 'bg-green-100 text-green-800 border-green-200',
    colorDark: 'bg-green-800 text-green-100'
  },
  Quotidien: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    colorDark: 'bg-blue-800 text-blue-100'
  },
  Autres: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    colorDark: 'bg-gray-800 text-gray-100'
  }
} as const;
