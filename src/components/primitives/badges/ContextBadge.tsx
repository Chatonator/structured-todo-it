import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TaskContext } from '@/types/task';
import { getContextClasses, getContextIcon } from '@/lib/styling';
import { cn } from '@/lib/utils';

export interface ContextBadgeProps {
  context: TaskContext;
  /** Afficher l'icône emoji */
  showIcon?: boolean;
  /** Afficher le label texte */
  showLabel?: boolean;
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
 * Badge de contexte Pro/Perso réutilisable
 */
export const ContextBadge: React.FC<ContextBadgeProps> = ({
  context,
  showIcon = true,
  showLabel = true,
  size = 'md',
  className
}) => {
  const icon = getContextIcon(context);
  
  return (
    <Badge
      variant="outline"
      className={cn(
        getContextClasses(context, 'badge'),
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <span className="mr-1">{icon}</span>}
      {showLabel && context}
    </Badge>
  );
};

export default ContextBadge;
