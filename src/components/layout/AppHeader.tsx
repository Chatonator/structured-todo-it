import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Undo, Redo, Menu } from 'lucide-react';
import UserOptionsMenu from '@/components/UserOptionsMenu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  tasksCount: number;
  completedTasks: number;
  completionRate: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenModal: () => void;
  onOpenTaskList?: () => void;
  isMobile?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  tasksCount,
  completedTasks,
  completionRate,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenModal,
  onOpenTaskList,
  isMobile = false
}) => {
  return (
    <header className="bg-background shadow-sm border-b border-border">
      <div className="px-3 md:px-6 py-2 md:py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Logo et titre */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Bouton menu hamburger sur mobile */}
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
            
            <div className="p-1.5 md:p-2 bg-primary rounded-lg">
              <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base md:text-xl font-bold text-foreground">TO-DO-IT</h1>
              {!isMobile && (
                <p className="text-xs text-muted-foreground hidden sm:block">Gestion sécurisée des tâches</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Version mobile: Menu dropdown pour historique et stats */}
            {isMobile ? (
              <>
                <Button
                  onClick={onOpenModal}
                  size="sm"
                  className="h-9"
                >
                  <Plus className="w-4 h-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <span className="text-xs">{tasksCount}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-2 space-y-2">
                      <div className="text-xs font-medium">Statistiques</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Actives</span>
                        <span className="font-medium">{tasksCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Terminées</span>
                        <span className="font-medium">{completedTasks}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">{completionRate}%</span>
                      </div>
                      <div className="pt-2 border-t flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onUndo}
                          disabled={!canUndo}
                          className="flex-1 h-8"
                        >
                          <Undo className="w-3 h-3 mr-1" />
                          Annuler
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onRedo}
                          disabled={!canRedo}
                          className="flex-1 h-8"
                        >
                          <Redo className="w-3 h-3 mr-1" />
                          Refaire
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <UserOptionsMenu />
              </>
            ) : (
              /* Version desktop: affichage complet */
              <>
                {/* Historique */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-accent rounded-lg border border-border">
                  <span className="text-xs text-muted-foreground font-medium">Historique:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="h-6 w-6 p-0 disabled:opacity-50"
                    title="Annuler (Ctrl+Z)"
                  >
                    <Undo className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="h-6 w-6 p-0 disabled:opacity-50"
                    title="Refaire (Ctrl+Y)"
                  >
                    <Redo className="w-3 h-3" />
                  </Button>
                </div>

                {/* Statistiques */}
                <div className="hidden md:flex items-center space-x-3 lg:space-x-4 text-xs text-muted-foreground">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>{tasksCount} actives</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-system-success rounded-full"></div>
                    <span>{completedTasks} terminées</span>
                  </span>
                  <span className="hidden lg:inline">{completionRate}% complet</span>
                </div>
                
                <Button
                  onClick={onOpenModal}
                  size="sm"
                  className="hidden sm:flex"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle tâche
                </Button>

                <Button
                  onClick={onOpenModal}
                  size="sm"
                  className="sm:hidden h-9 w-9 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                
                <UserOptionsMenu />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;