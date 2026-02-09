import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
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
  hasBeenLaunched = false 
}) => {
  const Icon = tool.icon;

  const handleQuickLaunch = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickLaunch?.();
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center p-4 rounded-xl border bg-card",
        "hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5",
        "transition-all duration-200 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-primary/50"
      )}
    >
      {/* Badges */}
      {(tool.isNew || tool.isBeta) && (
        <div className="absolute -top-2 -right-2">
          {tool.isNew && (
            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5">
              Nouveau
            </Badge>
          )}
          {tool.isBeta && !tool.isNew && (
            <Badge variant="outline" className="text-[10px] px-1.5">
              Beta
            </Badge>
          )}
        </div>
      )}

      {/* Quick launch button - only shown if tool has been launched before */}
      {hasBeenLaunched && onQuickLaunch && (
        <button
          onClick={handleQuickLaunch}
          className={cn(
            "absolute top-2 right-2 w-7 h-7 rounded-full",
            "bg-primary/10 hover:bg-primary/20",
            "flex items-center justify-center",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}
          title="Lancer directement"
        >
          <Play className="w-3.5 h-3.5 text-primary" />
        </button>
      )}

      {/* Icon */}
      <div className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center mb-3",
        "transition-transform duration-200 group-hover:scale-110",
        tool.bgColor
      )}>
        <Icon className={cn("w-7 h-7", tool.color)} />
      </div>

      {/* Text */}
      <div className="text-center">
        <div className="font-semibold text-sm mb-0.5 group-hover:text-primary transition-colors">
          {tool.name}
        </div>
        <div className="text-xs text-muted-foreground line-clamp-2">
          {tool.description}
        </div>
      </div>
    </button>
  );
};

export default ToolCard;
