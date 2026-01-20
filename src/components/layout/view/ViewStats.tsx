import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/primitives/cards';

export interface ViewStatsItem {
  id: string;
  value: string | number;
  label: string;
  icon?: ReactNode;
  subtitle?: string;
  valueClassName?: string;
  trend?: { value: number; label?: string };
  onClick?: () => void;
}

export interface ViewStatsProps {
  stats: ViewStatsItem[];
  variant?: 'default' | 'compact' | 'horizontal';
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

const columnClasses = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
  5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
};

/**
 * ViewStats - Grille de statistiques standardisée pour les vues
 * 
 * Utilisé pour afficher des métriques clés en haut d'une vue.
 * S'adapte automatiquement au nombre de colonnes et à la taille de l'écran.
 * 
 * @example
 * <ViewStats
 *   stats={[
 *     { id: 'total', label: 'Total', value: 42, icon: <ListTodo /> },
 *     { id: 'completed', label: 'Terminées', value: 28, icon: <CheckCircle2 /> },
 *   ]}
 *   columns={4}
 * />
 */
export const ViewStats: React.FC<ViewStatsProps> = ({
  stats,
  variant = 'default',
  columns = 4,
  className,
}) => {
  if (stats.length === 0) return null;

  // Auto-adjust columns based on stats count if not explicitly set
  const effectiveColumns = Math.min(columns, stats.length) as 2 | 3 | 4 | 5;

  return (
    <div
      className={cn(
        "grid gap-3 md:gap-4",
        columnClasses[effectiveColumns],
        className
      )}
    >
      {stats.map(({ id, ...statProps }) => (
        <StatCard
          key={id}
          variant={variant}
          {...statProps}
        />
      ))}
    </div>
  );
};

export default ViewStats;
