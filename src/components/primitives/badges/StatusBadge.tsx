import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getStatusClasses, getStatusLabel, StatusType } from '@/lib/styling';
import { cn } from '@/lib/utils';
import { Check, Clock, Circle, Loader2 } from 'lucide-react';

export interface StatusBadgeProps {
  status: StatusType;
  /** Afficher l'icône */
  showIcon?: boolean;
  /** Variante de taille */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1'
};

const iconSizes = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5'
};

const STATUS_ICONS: Record<StatusType, React.ElementType> = {
  'completed': Check,
  'done': Check,
  'in-progress': Loader2,
  'pending': Clock,
  'todo': Circle
};

/**
 * Badge de statut réutilisable
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md',
  className
}) => {
  const Icon = STATUS_ICONS[status];
  const label = getStatusLabel(status);
  
  return (
    <Badge
      variant="outline"
      className={cn(
        getStatusClasses(status, 'badge'),
        sizeClasses[size],
        className
      )}
    >
      {showIcon && Icon && (
        <Icon className={cn(iconSizes[size], 'mr-1', status === 'in-progress' && 'animate-spin')} />
      )}
      {label}
    </Badge>
  );
};

export default StatusBadge;
