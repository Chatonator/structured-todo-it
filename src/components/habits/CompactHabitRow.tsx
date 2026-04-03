import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Habit, HabitStreak } from '@/types/habit';
import { cn } from '@/lib/utils';

interface CompactHabitRowProps {
  habit: Habit;
  isCompleted: boolean;
  streak?: HabitStreak;
  isApplicableToday: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const CompactHabitRow: React.FC<CompactHabitRowProps> = ({
  habit,
  isCompleted,
  streak,
  isApplicableToday,
  onToggle,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px]',
        'hover:bg-muted/30',
        !isApplicableToday && 'opacity-40'
      )}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggle}
        disabled={!isApplicableToday}
        className="h-5 w-5 rounded-full border-2 data-[state=checked]:bg-habit data-[state=checked]:border-habit shrink-0"
      />

      {habit.icon && <span className="text-lg leading-none">{habit.icon}</span>}

      <span
        className={cn(
          'flex-1 text-sm font-medium truncate',
          isCompleted ? 'line-through text-muted-foreground/60' : 'text-foreground'
        )}
      >
        {habit.name}
      </span>

      {streak && streak.currentStreak > 0 && (
        <span className="flex items-center gap-1 text-xs font-semibold text-habit shrink-0">
          🔥 {streak.currentStreak}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <MoreVertical className="w-3.5 h-3.5" />
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

export default CompactHabitRow;
