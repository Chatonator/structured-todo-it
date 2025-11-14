import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Menu, Users, Settings } from 'lucide-react';
import UserOptionsMenu from '@/components/UserOptionsMenu';
import { useNavigate } from 'react-router-dom';
import ContextSwitch from '@/components/filters/ContextSwitch';
import SecondaryFilters from '@/components/filters/SecondaryFilters';
import { TaskCategory, TaskContext } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTeamContext } from '@/contexts/TeamContext';

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
  const { teams, currentTeam, setCurrentTeam, teamMembers } = useTeamContext();
  const navigate = useNavigate();

  const handleTeamChange = (value: string) => {
    if (value === 'personal') {
      setCurrentTeam(null);
    } else {
      const team = teams.find(t => t.id === value);
      if (team) {
        setCurrentTeam(team);
      }
    }
  };

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
                {/* Sélecteur d'équipe mobile */}
                <Select value={currentTeam?.id || 'personal'} onValueChange={handleTeamChange}>
                  <SelectTrigger className="h-9 w-auto min-w-[120px] bg-muted/50">
                    <div className="flex items-center gap-1.5">
                      {currentTeam ? (
                        <>
                          <Users className="w-3.5 h-3.5" />
                          <span className="text-xs truncate max-w-[80px]">{currentTeam.name}</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span className="text-xs">Perso</span>
                        </>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4" />
                        <span>Mes tâches</span>
                      </div>
                    </SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{team.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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

        {/* Deuxième ligne : Sélecteur d'équipe + Switch Pro/Perso + Filtres secondaires */}
        {!isMobile && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Sélecteur d'équipe avec label et badge */}
              <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Espace:</span>
                  <Select value={currentTeam?.id || 'personal'} onValueChange={handleTeamChange}>
                    <SelectTrigger className="w-[180px] h-8 border-0 bg-background hover:bg-accent">
                      <div className="flex items-center gap-2">
                        {currentTeam ? (
                          <>
                            <Users className="w-4 h-4 text-primary" />
                            <span className="font-medium">{currentTeam.name}</span>
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-4 h-4 text-primary" />
                            <span className="font-medium">Mes tâches</span>
                          </>
                        )}
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4" />
                          <span>Mes tâches personnelles</span>
                        </div>
                      </SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{team.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Badge nombre de membres si équipe sélectionnée */}
                {currentTeam && teamMembers.length > 0 && (
                  <Badge variant="secondary" className="h-6 px-2 text-xs">
                    {teamMembers.length} {teamMembers.length === 1 ? 'membre' : 'membres'}
                  </Badge>
                )}
                
                {/* Bouton Gérer mes équipes */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/teams')}
                  className="h-7 w-7"
                  title="Gérer mes équipes"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Séparateur visuel */}
              <div className="h-6 w-px bg-border" />

              {/* Switch principal Pro/Perso (uniquement en mode personnel) */}
              {!currentTeam && (
                <>
                  <ContextSwitch 
                    value={contextFilter}
                    onValueChange={onContextFilterChange}
                  />
                  <div className="h-6 w-px bg-border" />
                </>
              )}
            </div>
            
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