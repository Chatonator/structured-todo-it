import React from 'react';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamOption {
  id: string;
  name: string;
}

interface ContextPillSelectorProps {
  value: string;
  onChange: (value: 'Pro' | 'Perso') => void;
  teams?: TeamOption[];
  selectedTeamId?: string | null;
  onTeamSelect?: (teamId: string | null) => void;
}

export const ContextPillSelector: React.FC<ContextPillSelectorProps> = ({
  value,
  onChange,
  teams,
  selectedTeamId,
  onTeamSelect,
}) => {
  const isTeamSelected = !!selectedTeamId;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Contexte</Label>
      <div className="flex gap-2 flex-wrap">
        {(['Pro', 'Perso'] as const).map((ctx) => {
          const isSelected = value === ctx && !isTeamSelected;
          const isPro = ctx === 'Pro';
          return (
            <button
              key={ctx}
              type="button"
              onClick={() => {
                onTeamSelect?.(null);
                onChange(ctx);
              }}
              className={cn(
                'flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border',
                isSelected
                  ? isPro
                    ? 'bg-context-pro/15 border-context-pro text-context-pro shadow-sm'
                    : 'bg-context-perso/15 border-context-perso text-context-perso shadow-sm'
                  : 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              <span>{isPro ? '💼' : '🏠'}</span>
              <span>{ctx}</span>
            </button>
          );
        })}
        {teams && teams.length > 0 && teams.map((team) => {
          const isSelected = selectedTeamId === team.id;
          return (
            <button
              key={team.id}
              type="button"
              onClick={() => onTeamSelect?.(isSelected ? null : team.id)}
              className={cn(
                'flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border',
                isSelected
                  ? 'bg-primary/15 border-primary text-primary shadow-sm'
                  : 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              <Users className="w-4 h-4" />
              <span className="truncate">{team.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
