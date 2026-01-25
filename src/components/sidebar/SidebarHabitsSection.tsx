import React, { useState } from 'react';
import { Habit, HabitStreak } from '@/types/habit';
import { ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarListItem } from './SidebarListItem';

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
        <div className="px-1 pb-2">
          {habits.map(habit => {
            const isCompleted = completions[habit.id] || false;
            const streak = streaks[habit.id];
            
            return (
              <SidebarListItem
                key={habit.id}
                name={habit.name}
                icon={habit.icon}
                accentColor="hsl(var(--habit))"
                isCompleted={isCompleted}
                onToggleComplete={() => onToggleHabit(habit.id)}
                showCheckbox
                rightSlot={
                  streak && streak.currentStreak > 0 ? (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-habit/10 text-habit text-xs">
                      <span>🔥</span>
                      <span className="font-bold">{streak.currentStreak}</span>
                    </div>
                  ) : null
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
