import React, { useState } from 'react';
import { Habit } from '@/types/habit';
import { ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

import { HabitStreak } from '@/types/habit';

interface SidebarHabitsSectionProps {
  habits: Habit[];
  completions: Record<string, boolean>;
  streaks: Record<string, HabitStreak>;
  onToggleHabit: (habitId: string) => Promise<boolean | void>;
}

export const SidebarHabitsSection: React.FC<SidebarHabitsSectionProps> = ({
  habits,
  completions,
  streaks,
  onToggleHabit
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const completedCount = habits.filter(h => completions[h.id]).length;
  const totalCount = habits.length;

  if (habits.length === 0) return null;

  return (
    <div className="border-b border-border">
      <Button
        variant="ghost"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full justify-between px-3 py-2 h-auto"
      >
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-habit" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Habitudes ({completedCount}/{totalCount})
          </span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>

      {!isCollapsed && (
        <div className="px-3 pb-3 space-y-1">
          {habits.map(habit => {
            const isCompleted = completions[habit.id] || false;
            const streak = streaks[habit.id];
            
            return (
              <div
                key={habit.id}
                className={`
                  flex items-center gap-2 p-2 rounded-md transition-colors
                  ${isCompleted ? 'bg-habit/10' : 'bg-muted/30 hover:bg-muted/50'}
                `}
              >
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={() => onToggleHabit(habit.id)}
                  className="border-habit data-[state=checked]:bg-habit data-[state=checked]:border-habit"
                />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm truncate block ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                    {habit.icon && <span className="mr-1">{habit.icon}</span>}
                    {habit.name}
                  </span>
                </div>
                {streak && streak.currentStreak > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-habit/10 text-habit text-xs">
                    <span>🔥</span>
                    <span className="font-bold">{streak.currentStreak}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
