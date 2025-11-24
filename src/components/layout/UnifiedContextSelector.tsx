import React from 'react';
import { CheckSquare, Users, Briefcase, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const handleContextClick = (context: TaskContext | 'all') => {
    setCurrentTeam(null);
    onContextFilterChange(context);
  };

  const handleTeamClick = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setCurrentTeam(team);
      onContextFilterChange('all');
    }
  };

  const isActive = (value: string) => {
    if (value.startsWith('team-')) {
      const teamId = value.replace('team-', '');
      return currentTeam?.id === teamId;
    }
    return !currentTeam && contextFilter === value;
  };

  return (
    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
      <Button
        variant={isActive('all') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleContextClick('all')}
        className="h-8 px-3"
      >
        <CheckSquare className="w-4 h-4 mr-1.5" />
        Toutes
      </Button>
      
      <Button
        variant={isActive('Perso') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleContextClick('Perso')}
        className="h-8 px-3"
      >
        <Home className="w-4 h-4 mr-1.5" />
        Perso
      </Button>
      
      <Button
        variant={isActive('Pro') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleContextClick('Pro')}
        className="h-8 px-3"
      >
        <Briefcase className="w-4 h-4 mr-1.5" />
        Pro
      </Button>

      {teams.map((team) => (
        <Button
          key={team.id}
          variant={isActive(`team-${team.id}`) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleTeamClick(team.id)}
          className="h-8 px-3"
        >
          <Users className="w-4 h-4 mr-1.5" />
          {team.name}
        </Button>
      ))}
    </div>
  );
};

export default UnifiedContextSelector;
