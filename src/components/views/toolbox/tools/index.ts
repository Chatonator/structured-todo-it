import { Grid3X3, ListOrdered } from 'lucide-react';
import { ToolDefinition } from './types';
import EisenhowerTool from './eisenhower/EisenhowerTool';
import Rule135Tool from './rule135/Rule135Tool';

// Tool registry - single source of truth for all available tools
export const toolRegistry: ToolDefinition[] = [
  {
    id: 'eisenhower',
    name: 'Matrice Eisenhower',
    description: 'Prioriser par importance et urgence',
    icon: Grid3X3,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    category: 'prioritization',
    component: EisenhowerTool
  },
  {
    id: 'rule135',
    name: 'Méthode 1-3-5',
    description: 'Planifier 9 tâches par jour',
    icon: ListOrdered,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    category: 'planning',
    isNew: true,
    component: Rule135Tool
  }
];

// Helper to get a tool by ID
export const getToolById = (id: string): ToolDefinition | undefined => {
  return toolRegistry.find(tool => tool.id === id);
};

// Helper to get tools by category
export const getToolsByCategory = (category: string): ToolDefinition[] => {
  return toolRegistry.filter(tool => tool.category === category);
};

// Export types
export * from './types';
