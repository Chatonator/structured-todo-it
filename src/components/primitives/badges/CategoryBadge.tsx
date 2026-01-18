import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TaskCategory, getCategoryDisplayName } from '@/types/task';
import { getCategoryClasses } from '@/lib/styling';
import { cn } from '@/lib/utils';

export interface CategoryBadgeProps {
  category: TaskCategory;
  /** Afficher le nom complet ou abrégé */
  displayName?: boolean;
  /** Variante de taille */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1'
};

/**
 * Badge de catégorie de tâche réutilisable
 * Affiche Obligation, Quotidien, Envie ou Autres avec les couleurs appropriées
 */
export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  displayName = true,
  size = 'md',
  className
}) => {
  const label = displayName ? getCategoryDisplayName(category) : category;
  
  return (
    <Badge
      variant="outline"
      className={cn(
        getCategoryClasses(category, 'badge'),
        sizeClasses[size],
        className
      )}
    >
      {label}
    </Badge>
  );
};

export default CategoryBadge;
