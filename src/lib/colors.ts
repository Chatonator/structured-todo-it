/**
 * Utilitaire pour accéder aux couleurs définies dans tailwind.config.ts
 * Utilisé uniquement pour les bibliothèques qui nécessitent des couleurs hex (ex: Recharts)
 */
import tailwindConfig from '../../tailwind.config';

type ColorPath = string[];

function getNestedColor(obj: any, path: ColorPath): string | undefined {
  return path.reduce((current, key) => current?.[key], obj);
}

export const colors = {
  // Couleurs de catégorie
  category: {
    obligation: tailwindConfig.theme.extend.colors.category.obligation,
    quotidien: tailwindConfig.theme.extend.colors.category.quotidien,
    envie: tailwindConfig.theme.extend.colors.category.envie,
    autres: tailwindConfig.theme.extend.colors.category.autres,
  },
  
  // Couleurs de priorité
  priority: {
    highest: tailwindConfig.theme.extend.colors.priority.highest,
    high: tailwindConfig.theme.extend.colors.priority.high,
    medium: tailwindConfig.theme.extend.colors.priority.medium,
    low: tailwindConfig.theme.extend.colors.priority.low,
  },
  
  // Couleurs système
  primary: tailwindConfig.theme.extend.colors.primary.DEFAULT,
  success: tailwindConfig.theme.extend.colors.system.success,
  warning: tailwindConfig.theme.extend.colors.system.warning,
  error: tailwindConfig.theme.extend.colors.system.error,
  
  // Couleur habitudes
  habit: tailwindConfig.theme.extend.colors.habit.DEFAULT,
};

/**
 * Mapper une catégorie de tâche vers sa couleur hex
 */
export function getCategoryColor(category: string): string {
  const normalized = category.toLowerCase();
  switch (normalized) {
    case 'obligation':
      return colors.category.obligation;
    case 'quotidien':
      return colors.category.quotidien;
    case 'envie':
      return colors.category.envie;
    case 'autres':
      return colors.category.autres;
    default:
      return colors.category.autres;
  }
}

/**
 * Mapper une priorité vers sa couleur hex
 */
export function getPriorityColor(priority: 'highest' | 'high' | 'medium' | 'low'): string {
  return colors.priority[priority];
}
