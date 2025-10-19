import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Menu } from 'lucide-react';
import UserOptionsMenu from '@/components/UserOptionsMenu';
import ContextSwitch from '@/components/filters/ContextSwitch';
import SecondaryFilters from '@/components/filters/SecondaryFilters';
import { TaskCategory, TaskContext } from '@/types/task';
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
  onOpenModal: () => void;
  onOpenTaskList?: () => void;
  isMobile?: boolean;
  // Filtres
  contextFilter: TaskContext | 'all';
  onContextFilterChange: (context: TaskContext | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: TaskCategory | 'all';
  onCategoryFilterChange: (category: TaskCategory | 'all') => void;
  sortBy: 'name' | 'duration' | 'category';
  onSortChange: (sortBy: 'name' | 'duration' | 'category') => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  tasksCount,
  completedTasks,
  completionRate,
  onOpenModal,
  onOpenTaskList,
  isMobile = false,
  contextFilter,
  onContextFilterChange,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortChange
}) => {
  return (
    <header className="bg-background shadow-sm border-b border-border">
      <div className="px-3 md:px-6 py-2 md:py-3 space-y-3">
        {/* Première ligne : Logo, titre, stats, actions */}
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
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <UserOptionsMenu />
              </>
            ) : (
              /* Version desktop: affichage complet */
              <>
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

        {/* Deuxième ligne : Switch Pro/Perso + Filtres secondaires */}
        {!isMobile && (
          <div className="flex items-center justify-between gap-4">
            {/* Switch principal Pro/Perso */}
            <ContextSwitch 
              value={contextFilter}
              onValueChange={onContextFilterChange}
            />
            
            {/* Séparateur visuel */}
            <div className="h-6 w-px bg-border" />
            
            {/* Filtres secondaires */}
            <SecondaryFilters
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={onCategoryFilterChange}
              sortBy={sortBy}
              onSortChange={onSortChange}
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;