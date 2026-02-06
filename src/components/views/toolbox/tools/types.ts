import { ComponentType, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

// Tool categories for organization
export type ToolCategory = 'prioritization' | 'time-management' | 'planning' | 'focus';

// Props passed to every tool component
export interface ToolProps {
  onClose?: () => void;
}

// Tool definition for the registry
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string; // Tailwind color class (e.g., 'bg-blue-500')
  bgColor: string; // Background for card (e.g., 'bg-blue-500/10')
  category: ToolCategory;
  component: ComponentType<ToolProps>;
  isNew?: boolean;
  isBeta?: boolean;
}

// Category metadata for display
export interface CategoryInfo {
  id: ToolCategory;
  name: string;
  description: string;
}

export const TOOL_CATEGORIES: CategoryInfo[] = [
  {
    id: 'prioritization',
    name: 'Priorisation',
    description: 'Organiser et hiérarchiser vos tâches'
  },
  {
    id: 'planning',
    name: 'Planification',
    description: 'Structurer votre journée et vos objectifs'
  },
  {
    id: 'time-management',
    name: 'Gestion du temps',
    description: 'Optimiser votre temps de travail'
  },
  {
    id: 'focus',
    name: 'Concentration',
    description: 'Rester focus et éviter les distractions'
  }
];
