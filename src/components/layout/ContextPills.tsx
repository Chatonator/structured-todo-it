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
import { SegmentedControl, NavPill, headerSurfaceVariants } from '@/components/primitives/visual';

interface ContextPillsProps {
  contextFilter: TaskContext | 'all';
  onContextFilterChange: (context: TaskContext | 'all') => void;
}

const ContextPills: React.FC<ContextPillsProps> = ({
  contextFilter,
  onContextFilterChange,
}) => {
  const { teams, currentTeam, setCurrentTeam } = useTeamContext();
  const { preferences } = useUserPreferences();

  const handleContextClick = (context: TaskContext | 'all') => {
    setCurrentTeam(null);
    onContextFilterChange(context);
  };

  const handleTeamClick = (teamId: string) => {
    const team = teams.find((entry) => entry.id === teamId);
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

  const contexts = allContexts.filter((ctx) => {
    if (ctx.key === 'Pro' && !preferences.showProContext) return false;
    return true;
  });

  return (
    <div className="flex items-center gap-1.5">
      <SegmentedControl density="desktop" className="gap-0.5 rounded-xl">
        {contexts.map((ctx, index) => {
          const Icon = ctx.icon;
          return (
            <NavPill
              key={ctx.key}
              density="mobile"
              state={isActive(ctx.key) ? 'active' : 'inactive'}
              onClick={() => handleContextClick(ctx.key)}
              className={cn(
                'min-h-0 gap-1.5 rounded-lg px-3 py-1.5',
                index === 0 && 'rounded-l-lg',
                index === contexts.length - 1 && !teams.length && 'rounded-r-lg'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{ctx.label}</span>
            </NavPill>
          );
        })}
      </SegmentedControl>

      {teams.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size="sm"
              className={cn(
                headerSurfaceVariants({ density: 'desktop' }),
                'h-8 gap-1.5 px-3 type-filter-label',
                currentTeam ? 'header-chip-active' : 'header-chip-inactive'
              )}
            >
              <Users className="h-3.5 w-3.5" />
              <span className="hidden max-w-[100px] truncate sm:inline">{currentTeam?.name || 'Équipes'}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px] bg-background border-border">
            {teams.map((team) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleTeamClick(team.id)}
                className={cn('gap-2 cursor-pointer', currentTeam?.id === team.id && 'bg-accent')}
              >
                <Users className="h-4 w-4" />
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

