import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit2, Trash2, Calendar } from 'lucide-react';
import { Habit, HabitStreak, DAYS_OF_WEEK } from '@/types/habit';
import StreakBadge from './StreakBadge';

interface HabitItemProps {
  habit: Habit;
  isCompleted: boolean;
  streak?: HabitStreak;
  isApplicableToday?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const getFrequencyLabel = (habit: Habit): string => {
  switch (habit.frequency) {
    case 'daily':
      return 'Quotidien';
    case 'weekly':
      return 'Hebdo';
    case 'x-times-per-week':
      return `${habit.timesPerWeek}x/sem`;
    case 'monthly':
      if (habit.targetDays && habit.targetDays.length > 0) {
        if (habit.targetDays.length === 1) {
          return `Le ${habit.targetDays[0]}`;
        }
        return `${habit.targetDays.length} jours/mois`;
      }
      return 'Mensuel';
    case 'x-times-per-month':
      return `${habit.timesPerMonth || 1}x/mois`;
    case 'custom':
      if (habit.targetDays && habit.targetDays.length > 0) {
        if (habit.targetDays.length === 5 && !habit.targetDays.includes(5) && !habit.targetDays.includes(6)) {
          return 'Semaine';
        }
        if (habit.targetDays.length === 2 && habit.targetDays.includes(5) && habit.targetDays.includes(6)) {
          return 'Weekend';
        }
        return habit.targetDays.map(d => DAYS_OF_WEEK[d]?.short || '').join('');
      }
      return 'Personnalisé';
    default:
      return '';
  }
};

const HabitItem: React.FC<HabitItemProps> = ({
  habit,
  isCompleted,
  streak,
  isApplicableToday = true,
  onToggle,
  onEdit,
  onDelete
}) => {
  const frequencyLabel = getFrequencyLabel(habit);
  const showFrequencyBadge = habit.frequency !== 'daily';

  return (
    <div className={`flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-all ${
      !isApplicableToday ? 'opacity-50' : ''
    }`}>
      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggle}
        disabled={!isApplicableToday}
        className="data-[state=checked]:bg-habit data-[state=checked]:border-habit"
      />
      
      <div className="flex-1 flex items-center gap-3">
        {habit.icon && (
          <span className="text-2xl">{habit.icon}</span>
        )}
        
        <div className="flex-1">
          <h3 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {habit.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            {habit.description && (
              <p className="text-sm text-muted-foreground">{habit.description}</p>
            )}
            {showFrequencyBadge && (
              <Badge variant="outline" className="text-xs flex items-center gap-1 bg-muted/50">
                <Calendar className="w-3 h-3" />
                {frequencyLabel}
              </Badge>
            )}
          </div>
        </div>

        {streak && streak.currentStreak > 0 && (
          <StreakBadge streak={streak} />
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit2 className="w-4 h-4 mr-2" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default HabitItem;
