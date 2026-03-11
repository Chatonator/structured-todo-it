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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Team } from '@/hooks/useTeams';

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

/**
 * HeaderBar - Composant de header bicouche
 * Niveau 1: Logo, recherche, actions
 * Niveau 2: Contextes et navigation des vues
 */
const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenModal,
  onOpenTaskList,
  isMobile = false,
  contextFilter,
  onContextFilterChange,
  currentView,
  onViewChange,
  navigationItems,
  currentTeam
}) => {
  const [isBugHubOpen, setIsBugHubOpen] = useState(false);

  return (
    <header className="border-b border-border bg-background">
      {/* Niveau 1 - Barre principale */}
      <div className="app-header-chroma px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo et titre */}
          <div className="flex items-center gap-2 md:gap-3">
            {isMobile && onOpenTaskList && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenTaskList}
                className="h-9 w-9 p-0"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            
            <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-sm">
              <CheckSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">TO-DO-IT</h1>
          </div>
          
          {/* Sélecteur de contexte (desktop) */}
          {!isMobile && (
            <ContextPills
              contextFilter={contextFilter}
              onContextFilterChange={onContextFilterChange}
            />
          )}
          
          {/* Actions rapides + Profil */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Team mode indicator */}
            {currentTeam && (
              <Badge variant="secondary" className="gap-1.5 border-primary/20 bg-background/72 font-medium text-foreground shadow-sm backdrop-blur">
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{currentTeam.name}</span>
              </Badge>
            )}

            {/* Bug report button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="border border-border/60 bg-background/70 text-foreground/85 shadow-sm backdrop-blur hover:bg-background/85 hover:text-foreground"
                  onClick={() => setIsBugHubOpen(true)}
                >
                  <Bug className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Signaler / Mes demandes</TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <NotificationPanel />
            
            <Button
              onClick={onOpenModal}
              size={isMobile ? "sm" : "default"}
              className={cn(
                "shadow-sm hover:shadow-md transition-all duration-200 gap-2",
                currentTeam && "bg-primary"
              )}
            >
              <Plus className="w-4 h-4" />
              {!isMobile && <span>{
                currentTeam ? 'Tâche équipe' 
                : contextFilter === 'Perso' ? 'Tâche Perso'
                : contextFilter === 'Pro' ? 'Tâche Pro'
                : 'Nouvelle tâche'
              }</span>}
            </Button>
            
            {!isMobile && <UserProfileBlock />}
          </div>
        </div>
      </div>

      {/* Niveau 2 - Navigation des vues (desktop seulement) */}
      {!isMobile && (
        <div className="app-header-chroma border-t border-border/30 px-4 md:px-6 py-2">
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
