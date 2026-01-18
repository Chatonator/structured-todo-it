import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SubTaskCategory } from '@/types/task';
import { getPriorityClasses, getPriorityLevel } from '@/lib/styling';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

export interface PriorityBadgeProps {
  priority: SubTaskCategory | undefined;
  /** Mode d'affichage: text, stars, ou both */
  display?: 'text' | 'stars' | 'both';
  /** Variante de taille */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1'
};

const starSizes = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5'
};

/**
 * Badge de priorité réutilisable
 * Peut afficher le texte, des étoiles, ou les deux
 */
export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  display = 'text',
  size = 'md',
  className
}) => {
  if (!priority) return null;

  const level = getPriorityLevel(priority);
  
  const renderStars = () => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: level }).map((_, i) => (
          <Star
            key={i}
            className={cn(starSizes[size], 'fill-current')}
          />
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (display) {
      case 'stars':
        return renderStars();
      case 'both':
        return (
          <span className="flex items-center gap-1">
            {renderStars()}
            <span>{priority}</span>
          </span>
        );
      default:
        return priority;
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        getPriorityClasses(priority, 'badge'),
        sizeClasses[size],
        className
      )}
    >
      {renderContent()}
    </Badge>
  );
};

export default PriorityBadge;
