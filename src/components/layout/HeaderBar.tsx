import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Menu, Users, Bug } from 'lucide-react';
import BugHub from '@/components/bugs/BugHub';
import NotificationPanel from '@/components/notifications/NotificationPanel';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TaskContext } from '@/types/task';
import ContextPills from '@/components/layout/ContextPills';
import ViewNavigation from '@/components/layout/ViewNavigation';
import UserProfileBlock from '@/components/layout/UserProfileBlock';
import { cn } from '@/lib/utils';
import type { Team } from '@/hooks/useTeams';
import { StatBadge, headerSurfaceVariants } from '@/components/primitives/visual';

interface NavigationItem {
  key: string;
  title: string;
  icon: string;
}

interface HeaderBarProps {
  onOpenModal: () => void;
  onOpenTaskList?: () => void;
  isMobile?: boolean;
  contextFilter: TaskContext | 'all';
  onContextFilterChange: (context: TaskContext | 'all') => void;
  currentView: string;
  onViewChange: (view: string) => void;
  navigationItems: NavigationItem[];
  currentTeam?: Team | null;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenModal,
  onOpenTaskList,
  isMobile = false,
  contextFilter,
  onContextFilterChange,
  currentView,
  onViewChange,
  navigationItems,
  currentTeam,
}) => {
  const [isBugHubOpen, setIsBugHubOpen] = useState(false);

  return (
    <header className="app-header-chroma bg-background">
      <div className="px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            {isMobile && onOpenTaskList && (
              <Button variant="ghost" size="sm" onClick={onOpenTaskList} className="h-9 w-9 p-0">
                <Menu className="h-5 w-5" />
              </Button>
            )}

            <div className="rounded-xl bg-gradient-to-br from-[#390099] via-[#ff5400] to-[#ffbd00] p-2 shadow-sm">
              <CheckSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="type-view-title">TO-DO-IT</h1>
          </div>

          {!isMobile && (
            <ContextPills
              contextFilter={contextFilter}
              onContextFilterChange={onContextFilterChange}
            />
          )}

          <div className="flex items-center gap-2 md:gap-3">
            {currentTeam && (
              <StatBadge className="type-filter-label hidden sm:inline-flex">
                <Users className="h-3.5 w-3.5" />
                <span>{currentTeam.name}</span>
              </StatBadge>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(headerSurfaceVariants({ density: 'desktop' }), 'header-chip-inactive h-10 w-10 p-0')}
                  onClick={() => setIsBugHubOpen(true)}
                >
                  <Bug className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Signaler / Mes demandes</TooltipContent>
            </Tooltip>

            <NotificationPanel />

            <Button
              onClick={onOpenModal}
              size={isMobile ? 'sm' : 'default'}
              className={cn(
                'type-filter-label gap-2 border border-primary/25 shadow-lg transition-all duration-[var(--motion-standard-duration)] hover:shadow-xl',
                currentTeam && 'bg-primary'
              )}
            >
              <Plus className="h-4 w-4" />
              {!isMobile && (
                <span>
                  {currentTeam
                    ? 'Tâche équipe'
                    : contextFilter === 'Perso'
                      ? 'Tâche Perso'
                      : contextFilter === 'Pro'
                        ? 'Tâche Pro'
                        : 'Nouvelle tâche'}
                </span>
              )}
            </Button>

            {!isMobile && <UserProfileBlock />}
          </div>
        </div>
      </div>

      {!isMobile && (
        <div className="px-4 pb-2 md:px-6">
          <ViewNavigation
            currentView={currentView}
            onViewChange={onViewChange}
            navigationItems={navigationItems}
          />
        </div>
      )}

      <BugHub open={isBugHubOpen} onOpenChange={setIsBugHubOpen} />
    </header>
  );
};

export default HeaderBar;
