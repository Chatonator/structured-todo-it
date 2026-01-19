import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ItemListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  
  // États
  loading?: boolean;
  error?: string;
  
  // Empty state
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  
  // Layout
  layout?: 'list' | 'grid';
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  
  // Styling
  className?: string;
  itemClassName?: string;
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

/**
 * ItemList - Liste générique avec support pour loading, error et empty states
 * 
 * @example
 * <ItemList
 *   items={tasks}
 *   renderItem={(task) => <TaskCard task={task} />}
 *   keyExtractor={(task) => task.id}
 *   emptyTitle="Aucune tâche"
 *   layout="grid"
 *   columns={3}
 * />
 */
export function ItemList<T>({
  items,
  renderItem,
  keyExtractor,
  loading = false,
  error,
  emptyIcon,
  emptyTitle = "Aucun élément",
  emptyMessage,
  emptyAction,
  layout = 'list',
  columns = 1,
  gap = 'md',
  className,
  itemClassName,
}: ItemListProps<T>) {
  // Loading state
  if (loading) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="mt-3 text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-3">
          ⚠️
        </div>
        <p className="text-sm text-destructive font-medium">Erreur</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
        {emptyIcon && (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
            {emptyIcon}
          </div>
        )}
        <p className="text-lg font-medium text-foreground">{emptyTitle}</p>
        {emptyMessage && (
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">{emptyMessage}</p>
        )}
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    );
  }

  // List layout
  if (layout === 'list') {
    return (
      <div className={cn("flex flex-col", gapClasses[gap], className)}>
        {items.map((item, index) => (
          <div key={keyExtractor(item, index)} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  // Grid layout
  return (
    <div className={cn("grid", columnClasses[columns], gapClasses[gap], className)}>
      {items.map((item, index) => (
        <div key={keyExtractor(item, index)} className={itemClassName}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

export default ItemList;
