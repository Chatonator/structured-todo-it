import React from 'react';
import { CheckSquare, Users, Briefcase, Home, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TaskContext } from '@/types/task';
import { useTeamContext } from '@/contexts/TeamContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { cn } from '@/lib/utils';

interface ContextPillsProps {
  contextFilter: TaskContext | 'all';
  onContextFilterChange: (context: TaskContext | 'all') => void;
}

const ContextPills: React.FC<ContextPillsProps> = ({
  contextFilter,
  onContextFilterChange
}) => {
  const { teams, currentTeam, setCurrentTeam } = useTeamContext();
  const { preferences } = useUserPreferences();

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

  const allContexts = [
    { key: 'all', label: 'Toutes', icon: CheckSquare },
    { key: 'Perso', label: 'Perso', icon: Home },
    { key: 'Pro', label: 'Pro', icon: Briefcase },
  ] as const;

  const contexts = allContexts.filter(ctx => {
    if (ctx.key === 'Pro' && !preferences.showProContext) return false;
    return true;
  });

  return (
    <div className="flex items-center gap-1">
      {/* Pills segmentées pour contextes */}
      <div className="flex items-center rounded-lg border border-white/30 bg-background/42 p-0.5 shadow-sm backdrop-blur">
        {contexts.map((ctx, index) => {
          const Icon = ctx.icon;
          const active = isActive(ctx.key);
          return (
            <button
              key={ctx.key}
              onClick={() => handleContextClick(ctx.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold transition-all duration-200",
                index === 0 && "rounded-l-md",
                index === contexts.length - 1 && !teams.length && "rounded-r-md",
                active 
                  ? "bg-background/88 text-foreground shadow-sm ring-1 ring-white/45 backdrop-blur" 
                  : "app-header-adaptive-ink hover:bg-background/62"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{ctx.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dropdown unique pour équipes (même avec 1 seule équipe) */}
      {teams.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={currentTeam ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "h-8 gap-1.5 border-white/30 bg-background/58 px-3 shadow-sm backdrop-blur",
                currentTeam ? "bg-background/88 text-foreground ring-1 ring-white/45" : "app-header-adaptive-ink"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline max-w-[100px] truncate">
                {currentTeam?.name || 'Équipes'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px] bg-background border-border">
            {teams.map((team) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleTeamClick(team.id)}
                className={cn(
                  "gap-2 cursor-pointer",
                  currentTeam?.id === team.id && "bg-accent"
                )}
              >
                <Users className="w-4 h-4" />
                <span>{team.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default ContextPills;
