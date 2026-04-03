import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Habit, HabitStreak } from '@/types/habit';
import { Deck } from '@/types/habit';
import CompactHabitRow from './CompactHabitRow';

interface HabitDeckContainerProps {
  deck: Deck;
  habits: Habit[];
  streaks: Record<string, HabitStreak>;
  isCompletedToday: (habitId: string) => boolean;
  isHabitApplicableToday: (habit: Habit) => boolean;
  onToggle: (habitId: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onAddHabit: (deckId: string) => void;
}

const HabitDeckContainer: React.FC<HabitDeckContainerProps> = ({
  deck,
  habits,
  streaks,
  isCompletedToday,
  isHabitApplicableToday,
  onToggle,
  onEdit,
  onDelete,
  onAddHabit,
}) => {
  const completedCount = habits.filter(h => isCompletedToday(h.id)).length;
  const applicableCount = habits.filter(h => isHabitApplicableToday(h)).length;

  return (
    <div className="border border-border/40 bg-card/30 backdrop-blur-sm rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          {deck.icon && <span className="text-lg">{deck.icon}</span>}
          <h3 className="text-sm font-semibold text-foreground">{deck.name}</h3>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{applicableCount}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-habit"
          onClick={() => onAddHabit(deck.id)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Habits list */}
      <div className="p-1">
        {habits.length === 0 ? (
          <button
            onClick={() => onAddHabit(deck.id)}
            className="w-full py-6 text-sm text-muted-foreground hover:text-habit transition-colors"
          >
            + Ajouter une habitude
          </button>
        ) : (
          habits.map(habit => (
            <CompactHabitRow
              key={habit.id}
              habit={habit}
              isCompleted={isCompletedToday(habit.id)}
              streak={streaks[habit.id]}
              isApplicableToday={isHabitApplicableToday(habit)}
              onToggle={() => onToggle(habit.id)}
              onEdit={() => onEdit(habit)}
              onDelete={() => onDelete(habit.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default HabitDeckContainer;
