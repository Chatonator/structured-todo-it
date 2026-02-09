import React from 'react';
import { Habit, HabitStreak } from '@/types/habit';
import HabitDeckCard from './HabitDeckCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface HabitGridProps {
  habits: Habit[];
  streaks: Record<string, HabitStreak>;
  isCompletedToday: (habitId: string) => boolean;
  isHabitApplicableToday: (habit: Habit) => boolean;
  onToggle: (habitId: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  showNewHabitZone?: boolean;
  onNewHabitClick?: () => void;
}

/**
 * Grille d'habitudes au style deck/projet
 * Layout responsive similaire à ProjectGrid
 */
const HabitGrid: React.FC<HabitGridProps> = ({
  habits,
  streaks,
  isCompletedToday,
  isHabitApplicableToday,
  onToggle,
  onEdit,
  onDelete,
  showNewHabitZone = false,
  onNewHabitClick
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {habits.map(habit => (
        <HabitDeckCard
          key={habit.id}
          habit={habit}
          isCompleted={isCompletedToday(habit.id)}
          streak={streaks[habit.id]}
          isApplicableToday={isHabitApplicableToday(habit)}
          onToggle={() => onToggle(habit.id)}
          onEdit={() => onEdit(habit)}
          onDelete={() => onDelete(habit.id)}
        />
      ))}
      
      {showNewHabitZone && onNewHabitClick && (
        <button
          onClick={onNewHabitClick}
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-habit/50 hover:bg-habit/5 transition-all min-h-[180px] group"
        >
          <div className="w-12 h-12 rounded-full bg-habit/10 flex items-center justify-center group-hover:bg-habit/20 transition-colors">
            <Plus className="w-6 h-6 text-habit" />
          </div>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-habit transition-colors">
            Nouvelle habitude
          </span>
        </button>
      )}
    </div>
  );
};

export default HabitGrid;
