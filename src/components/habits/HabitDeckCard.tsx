import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit2, Trash2, Flame, Calendar } from 'lucide-react';
import { Habit, HabitStreak } from '@/types/habit';
import { getHabitFrequencyLabel } from '@/lib/habits/formatters';

interface HabitDeckCardProps {
  habit: Habit;
  isCompleted: boolean;
  streak?: HabitStreak;
  isApplicableToday?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Carte habitude au style deck, similaire à ProjectCard
 * Affiche l'habitude dans une carte structurée avec progression de streak
 */
const HabitDeckCard: React.FC<HabitDeckCardProps> = ({
  habit,
  isCompleted,
  streak,
  isApplicableToday = true,
  onToggle,
  onEdit,
  onDelete
}) => {
  const frequencyLabel = getHabitFrequencyLabel(habit);
  const showFrequencyBadge = habit.frequency !== 'daily';
  const currentStreak = streak?.currentStreak ?? 0;
  const bestStreak = streak?.longestStreak ?? 0;
  
  // Calculer une "progression" basée sur le streak vs meilleur streak
  const streakProgress = bestStreak > 0 ? Math.min(100, (currentStreak / bestStreak) * 100) : (currentStreak > 0 ? 100 : 0);

  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-md",
        !isApplicableToday && "opacity-50"
      )}
      style={{ borderLeftColor: 'hsl(var(--habit))', borderLeftWidth: '4px' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={onToggle}
              disabled={!isApplicableToday}
              className="data-[state=checked]:bg-habit data-[state=checked]:border-habit shrink-0"
            />
            {habit.icon && <span className="text-2xl shrink-0">{habit.icon}</span>}
            <CardTitle className={cn(
              "text-lg truncate",
              isCompleted && "line-through text-muted-foreground"
            )}>
              {habit.name}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {showFrequencyBadge && (
              <Badge variant="outline" className="text-xs gap-1 bg-muted/50">
                <Calendar className="w-3 h-3" />
                {frequencyLabel}
              </Badge>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {habit.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {habit.description}
          </p>
        )}

        {/* Streak progress - style similaire à la progression projet */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Flame className="w-4 h-4 text-habit" />
              Série en cours
            </span>
            <span className="font-medium text-habit">
              {currentStreak} jour{currentStreak !== 1 ? 's' : ''}
            </span>
          </div>
          <Progress 
            value={streakProgress} 
            className="h-2 [&>div]:bg-habit"
          />
          {bestStreak > 0 && (
            <div className="flex justify-end">
              <span className="text-xs text-muted-foreground">
                Record: {bestStreak} jours
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HabitDeckCard;

