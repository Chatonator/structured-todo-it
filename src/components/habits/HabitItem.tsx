import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Habit, HabitStreak } from '@/types/habit';
import StreakBadge from './StreakBadge';

interface HabitItemProps {
  habit: Habit;
  isCompleted: boolean;
  streak?: HabitStreak;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const HabitItem: React.FC<HabitItemProps> = ({
  habit,
  isCompleted,
  streak,
  onToggle,
  onEdit,
  onDelete
}) => {
  return (
    <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-all">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggle}
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
          {habit.description && (
            <p className="text-sm text-muted-foreground">{habit.description}</p>
          )}
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
