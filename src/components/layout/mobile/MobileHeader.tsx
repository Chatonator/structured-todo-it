import React from 'react';
import { CheckSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ContextPills from '@/components/layout/ContextPills';
import { getViewConfig } from '@/components/routing/viewRegistry';
import { TaskContext } from '@/types/task';
import type { Team } from '@/hooks/useTeams';
import { StatBadge, headerSurfaceVariants } from '@/components/primitives/visual';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  currentView: string;
  contextFilter: TaskContext | 'all';
  onContextFilterChange: (value: TaskContext | 'all') => void;
  currentTeam?: Team | null;
  onOpenTaskHub: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentView,
  contextFilter,
  onContextFilterChange,
  currentTeam,
  onOpenTaskHub,
}) => {
  const currentViewConfig = getViewConfig(currentView);

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="app-header-chroma px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.875rem)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="type-meta uppercase tracking-[0.18em]">TO-DO-IT</p>
            <h1 className="type-section-title truncate">{currentViewConfig?.title || 'Organisation'}</h1>
            {currentViewConfig?.subtitle && (
              <p className="line-clamp-1 text-xs text-muted-foreground">{currentViewConfig.subtitle}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {currentTeam && (
              <StatBadge className="hidden max-w-[34vw] sm:inline-flex">
                <Users className="h-3.5 w-3.5" />
                <span className="truncate type-filter-label">{currentTeam.name}</span>
              </StatBadge>
            )}
            <Button
              variant="ghost"
              className={cn(headerSurfaceVariants({ density: 'mobile' }), 'type-filter-label h-10 rounded-full px-3')}
              onClick={onOpenTaskHub}
            >
              <CheckSquare className="mr-1.5 h-4 w-4" />
              Tâches
            </Button>
          </div>
        </div>

        {currentTeam && (
          <StatBadge className="mt-3 inline-flex max-w-full sm:hidden">
            <Users className="h-3.5 w-3.5" />
            <span className="truncate type-filter-label">{currentTeam.name}</span>
          </StatBadge>
        )}

        <div className="mt-3 overflow-x-auto pb-1">
          <ContextPills contextFilter={contextFilter} onContextFilterChange={onContextFilterChange} />
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;

