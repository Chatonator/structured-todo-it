import React from 'react';
import { CheckSquare, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ContextPills from '@/components/layout/ContextPills';
import { getViewConfig } from '@/components/routing/viewRegistry';
import { TaskContext } from '@/types/task';
import type { Team } from '@/hooks/useTeams';

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
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.875rem)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">TO-DO-IT</p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {currentViewConfig?.title || 'Organisation'}
            </h1>
            {currentViewConfig?.subtitle && (
              <p className="line-clamp-1 text-xs text-muted-foreground">{currentViewConfig.subtitle}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {currentTeam && (
              <Badge variant="secondary" className="hidden max-w-[34vw] gap-1 rounded-full bg-primary/10 text-primary sm:inline-flex">
                <Users className="h-3.5 w-3.5" />
                <span className="truncate">{currentTeam.name}</span>
              </Badge>
            )}
            <Button variant="outline" className="h-10 rounded-full px-3" onClick={onOpenTaskHub}>
              <CheckSquare className="mr-1.5 h-4 w-4" />
              Tâches
            </Button>
          </div>
        </div>

        {currentTeam && (
          <Badge variant="secondary" className="mt-3 inline-flex max-w-full gap-1 rounded-full bg-primary/10 text-primary sm:hidden">
            <Users className="h-3.5 w-3.5" />
            <span className="truncate">{currentTeam.name}</span>
          </Badge>
        )}

        <div className="mt-3 overflow-x-auto pb-1">
          <ContextPills contextFilter={contextFilter} onContextFilterChange={onContextFilterChange} />
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
