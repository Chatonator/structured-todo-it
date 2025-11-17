import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HabitStreak } from '@/types/habit';

interface StreakBadgeProps {
  streak: HabitStreak;
}

const StreakBadge: React.FC<StreakBadgeProps> = ({ streak }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-habit-light text-habit border border-habit/20">
            <span className="text-sm">🔥</span>
            <span className="text-sm font-bold">{streak.currentStreak}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm space-y-1">
            <p>Série actuelle : {streak.currentStreak} jours</p>
            <p>Record : {streak.longestStreak} jours</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default StreakBadge;
