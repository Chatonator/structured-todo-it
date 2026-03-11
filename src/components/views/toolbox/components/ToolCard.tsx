import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CircleHelp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolDefinition } from '../tools/types';

interface ToolCardProps {
  tool: ToolDefinition;
  onClick: () => void;
  onQuickLaunch?: () => void;
  hasBeenLaunched?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  onClick,
  onQuickLaunch,
}) => {
  const Icon = tool.icon;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const handleInfoClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onQuickLaunch?.();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative flex flex-col items-center rounded-xl border bg-card p-4',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-primary/50'
      )}
    >
      {(tool.isNew || tool.isBeta) && (
        <div className="absolute left-2 top-2">
          {tool.isNew && (
            <Badge className="bg-primary px-1.5 text-[10px] text-primary-foreground">
              Nouveau
            </Badge>
          )}
          {tool.isBeta && !tool.isNew && (
            <Badge variant="outline" className="px-1.5 text-[10px]">
              Beta
            </Badge>
          )}
        </div>
      )}

      {onQuickLaunch && (
        <button
          type="button"
          onClick={handleInfoClick}
          className={cn(
            'absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full',
            'bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm',
            'opacity-100 transition-colors hover:bg-background hover:text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/50'
          )}
          title="Informations sur l'outil"
          aria-label={`Informations sur ${tool.name}`}
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      )}

      <div className={cn(
        'mb-3 flex h-14 w-14 items-center justify-center rounded-xl',
        'transition-transform duration-200 group-hover:scale-110',
        tool.bgColor
      )}>
        <Icon className={cn('h-7 w-7', tool.color)} />
      </div>

      <div className="text-center">
        <div className="mb-0.5 text-sm font-semibold transition-colors group-hover:text-primary">
          {tool.name}
        </div>
        <div className="line-clamp-2 text-xs text-muted-foreground">
          {tool.description}
        </div>
      </div>
    </div>
  );
};

export default ToolCard;
