import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskContext } from '@/types/task';
import { useTeamContext } from '@/contexts/TeamContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LevelDisplay from './LevelDisplay';
import UserProfile from './UserProfile';

interface NavigationItem {
  key: string;
  title: string;
  icon: string;
}

interface AppHeaderProps {
  onOpenModal: () => void;
  onOpenTaskList: () => void;
  isMobile: boolean;
  contextFilter: TaskContext | 'all';
  onContextFilterChange: (context: TaskContext | 'all') => void;
  currentView: string;
  onViewChange: (view: string) => void;
  navigationItems: NavigationItem[];
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenModal,
  onOpenTaskList,
  isMobile,
  contextFilter,
  onContextFilterChange,
  currentView,
  onViewChange,
  navigationItems,
}) => {
  const { teams, currentTeam, setCurrentTeam } = useTeamContext();

  const handleTeamChange = (value: string) => {
    if (value === 'all') {
      onContextFilterChange('all');
      setCurrentTeam(null);
    } else if (value === 'personal') {
      onContextFilterChange('Perso');
      setCurrentTeam(null);
    } else if (value === 'pro') {
      onContextFilterChange('Pro');
      setCurrentTeam(null);
    } else {
      const team = teams.find(t => t.id === value);
      if (team) {
        setCurrentTeam(team);
        onContextFilterChange('all');
      }
    }
  };

  const getCurrentValue = () => {
    if (currentTeam) return currentTeam.id;
    if (contextFilter === 'Perso') return 'personal';
    if (contextFilter === 'Pro') return 'pro';
    return 'all';
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
      <div className="px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo et titre */}
          <div className="flex items-center space-x-3">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              TO-DO-IT
            </h1>
          </div>

          {/* Centre : Sélecteur + Navigation (desktop) */}
          {!isMobile && (
            <div className="flex items-center gap-4 flex-1 justify-center">
              {/* Sélecteur d'équipe/contexte compact */}
              <div className="flex items-center gap-2">
                <Select 
                  value={getCurrentValue()} 
                  onValueChange={handleTeamChange}
                >
                  <SelectTrigger className="w-[160px] h-9 bg-background border-border">
                    <SelectValue placeholder="Contexte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="personal">Personnel</SelectItem>
                    <SelectItem value="pro">Professionnel</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Navigation intégrée */}
              <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                {navigationItems.map((item) => (
                  <Button
                    key={item.key}
                    variant={currentView === item.key ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onViewChange(item.key)}
                    className={`
                      px-3 h-8 text-xs font-medium transition-all
                      ${currentView === item.key 
                        ? 'shadow-sm' 
                        : 'hover:bg-accent/50'
                      }
                    `}
                  >
                    <span className="mr-1.5">{item.icon}</span>
                    <span className="hidden lg:inline">{item.title}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Mobile : Sélecteur simplifié */}
          {isMobile && (
            <Select 
              value={getCurrentValue()} 
              onValueChange={handleTeamChange}
            >
              <SelectTrigger className="w-[120px] h-9 bg-background border-border text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="personal">Perso</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Droite : Actions */}
          <div className="flex items-center gap-2">
            {/* Nouvelle tâche */}
            <Button
              onClick={onOpenModal}
              size={isMobile ? "icon" : "default"}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-9"
            >
              <Plus className="h-4 w-4" />
              {!isMobile && <span className="ml-2">Nouvelle tâche</span>}
            </Button>

            {/* Level Display (desktop uniquement) */}
            {!isMobile && <LevelDisplay />}

            {/* Profil utilisateur */}
            <UserProfile />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
