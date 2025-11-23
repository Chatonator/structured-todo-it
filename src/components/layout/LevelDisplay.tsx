import React from 'react';
import { Trophy, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGamification } from '@/hooks/useGamification';

const LevelDisplay: React.FC = () => {
  const { progress, loading, getProgressPercentage } = useGamification();

  if (loading || !progress) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 animate-pulse">
        <div className="h-5 w-5 rounded-full bg-muted" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
    );
  }

  const progressPercentage = getProgressPercentage();
  const xpInCurrentLevel = progress.totalXp - Math.floor(100 * Math.pow(progress.currentLevel, 1.5));
  const xpNeededForLevel = progress.xpForNextLevel - Math.floor(100 * Math.pow(progress.currentLevel, 1.5));

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer group">
            <Badge 
              variant="secondary" 
              className="flex items-center gap-1 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold px-2 py-0.5 group-hover:scale-105 transition-transform"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>{progress.currentLevel}</span>
            </Badge>
            
            <div className="hidden sm:flex flex-col gap-0.5 min-w-[80px]">
              <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                <Zap className="h-3 w-3 text-accent" />
                <span>{xpInCurrentLevel} / {xpNeededForLevel}</span>
              </div>
              <Progress value={progressPercentage} className="h-1.5 bg-muted" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-card border-border">
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Niveau {progress.currentLevel}
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">XP Total:</span>
                <span className="font-medium">{progress.totalXp.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Prochain niveau:</span>
                <span className="font-medium">{progress.xpForNextLevel.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Progression:</span>
                <span className="font-medium">{Math.round(progressPercentage)}%</span>
              </div>
            </div>
            <Progress value={progressPercentage} className="h-2 mt-2" />
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LevelDisplay;
