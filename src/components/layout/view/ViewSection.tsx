import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronRight } from 'lucide-react';

export interface ViewSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  
  // Action "Voir tout"
  showViewAll?: boolean;
  viewAllLabel?: string;
  onViewAll?: () => void;
  
  // Custom actions
  actions?: React.ReactNode;
  
  // Content
  children: React.ReactNode;
  
  // Styling
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  
  // Variants
  variant?: 'default' | 'card' | 'minimal';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

/**
 * ViewSection - Section avec titre + lien "Voir tout" réutilisable
 * 
 * Utilisé pour structurer les vues avec des sections cohérentes.
 * Extrait du pattern répété dans HomeView et autres vues.
 * 
 * @example
 * <ViewSection
 *   title="Tâches prioritaires"
 *   icon={<Target className="w-5 h-5" />}
 *   showViewAll
 *   onViewAll={() => setCurrentView('tasks')}
 * >
 *   <TaskList tasks={priorityTasks} variant="compact" />
 * </ViewSection>
 */
export const ViewSection: React.FC<ViewSectionProps> = ({
  title,
  subtitle,
  icon,
  showViewAll = false,
  viewAllLabel = "Voir tout",
  onViewAll,
  actions,
  children,
  className,
  headerClassName,
  contentClassName,
  variant = 'default',
}) => {
  const containerClasses = cn(
    variant === 'card' && "bg-card border border-border rounded-lg p-4",
    variant === 'minimal' && "",
    className
  );

  const headerClasses = cn(
    "flex items-center justify-between gap-4 mb-4",
    variant === 'card' && "pb-3 border-b border-border mb-4",
    headerClassName
  );

  return (
    <section className={containerClasses}>
      <header className={headerClasses}>
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <span className="flex-shrink-0 text-primary">{icon}</span>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
          
          {showViewAll && onViewAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {viewAllLabel}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </header>

      <div className={contentClassName}>
        {children}
      </div>
    </section>
  );
};

export default ViewSection;
