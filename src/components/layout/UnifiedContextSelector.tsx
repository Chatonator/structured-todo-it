import React from 'react';
import { CheckSquare, Users, Briefcase, Home } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskContext } from '@/types/task';
import { useTeamContext } from '@/contexts/TeamContext';

interface UnifiedContextSelectorProps {
  contextFilter: TaskContext | 'all';
  onContextFilterChange: (context: TaskContext | 'all') => void;
}

const UnifiedContextSelector: React.FC<UnifiedContextSelectorProps> = ({
  contextFilter,
  onContextFilterChange
}) => {
  const { teams, currentTeam, setCurrentTeam } = useTeamContext();

  const handleValueChange = (value: string) => {
    // Si c'est une équipe
    if (value.startsWith('team-')) {
      const teamId = value.replace('team-', '');
      const team = teams.find(t => t.id === teamId);
      if (team) {
        setCurrentTeam(team);
        onContextFilterChange('all');
      }
    } else {
      // Sinon c'est un contexte personnel
      setCurrentTeam(null);
      onContextFilterChange(value as TaskContext | 'all');
    }
  };

  const getCurrentValue = () => {
    if (currentTeam) {
      return `team-${currentTeam.id}`;
    }
    return contextFilter;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border hover:bg-muted/70 transition-colors">
      <Select value={getCurrentValue()} onValueChange={handleValueChange}>
        <SelectTrigger className="h-9 border-0 bg-transparent hover:bg-accent font-medium">
          <div className="flex items-center gap-2">
            {currentTeam ? (
              <>
                <Users className="w-4 h-4 text-primary" />
                <span className="truncate">{currentTeam.name}</span>
              </>
            ) : contextFilter === 'Pro' ? (
              <>
                <Briefcase className="w-4 h-4 text-primary" />
                <span>Mes tâches pro</span>
              </>
            ) : contextFilter === 'Perso' ? (
              <>
                <Home className="w-4 h-4 text-primary" />
                <span>Mes tâches perso</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4 text-primary" />
                <span>Toutes mes tâches</span>
              </>
            )}
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              <span>Toutes mes tâches</span>
            </div>
          </SelectItem>
          <SelectItem value="Perso">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span>Mes tâches perso</span>
            </div>
          </SelectItem>
          <SelectItem value="Pro">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>Mes tâches pro</span>
            </div>
          </SelectItem>
          {teams.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Mes équipes
              </div>
              {teams.map((team) => (
                <SelectItem key={team.id} value={`team-${team.id}`}>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{team.name}</span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UnifiedContextSelector;
