import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Flame } from 'lucide-react';
import { Habit, HabitStreak, DAYS_OF_WEEK } from '@/types/habit';

export interface HabitCardProps {
  habit: Habit;
  isCompleted?: boolean;
  streak?: HabitStreak;
  variant?: 'default' | 'compact' | 'minimal';
  showStreak?: boolean;
  showFrequency?: boolean;
  isApplicableToday?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * Calcule le label de fréquence pour une habitude
 */
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

/**
 * HabitCard - Carte habitude réutilisable avec variantes
 * 
 * @example
 * <HabitCard
 *   habit={habit}
 *   isCompleted={true}
 *   streak={{ currentStreak: 5 }}
 *   onToggle={() => handleToggle(habit.id)}
 * />
 */
export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompleted = false,
  streak,
  variant = 'default',
  showStreak = true,
  showFrequency = true,
  isApplicableToday = true,
  onToggle,
  onClick,
  className,
}) => {
  const frequencyLabel = getFrequencyLabel(habit);
  const showFrequencyBadge = showFrequency && habit.frequency !== 'daily';
  const currentStreak = streak?.currentStreak ?? 0;

  if (variant === 'minimal') {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 p-2 rounded-md",
          onClick && "cursor-pointer hover:bg-accent/50",
          !isApplicableToday && "opacity-50",
          className
        )}
      >
        {onToggle && (
          <Checkbox
            checked={isCompleted}
            onCheckedChange={onToggle}
            disabled={!isApplicableToday}
            className="data-[state=checked]:bg-habit data-[state=checked]:border-habit"
          />
        )}
        {habit.icon && <span className="text-lg">{habit.icon}</span>}
        <span className={cn(
          "text-sm flex-1",
          isCompleted && "line-through text-muted-foreground"
        )}>
          {habit.name}
        </span>
        {showStreak && currentStreak > 0 && (
          <div className="flex items-center gap-1 text-xs text-habit">
            <Flame className="w-3 h-3" />
            <span>{currentStreak}</span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border border-border bg-card",
          onClick && "cursor-pointer hover:shadow-sm",
          !isApplicableToday && "opacity-50",
          className
        )}
      >
        {onToggle && (
          <Checkbox
            checked={isCompleted}
            onCheckedChange={onToggle}
            disabled={!isApplicableToday}
            className="data-[state=checked]:bg-habit data-[state=checked]:border-habit"
          />
        )}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {habit.icon && <span className="text-xl">{habit.icon}</span>}
          <span className={cn(
            "font-medium truncate",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {habit.name}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {showFrequencyBadge && (
            <Badge variant="outline" className="text-xs bg-muted/50">
              {frequencyLabel}
            </Badge>
          )}
          {showStreak && currentStreak > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-habit/10 text-habit text-xs font-medium">
              <Flame className="w-3 h-3" />
              <span>{currentStreak}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <Card
      onClick={onClick}
      className={cn(
        "transition-all",
        onClick && "cursor-pointer hover:shadow-md",
        !isApplicableToday && "opacity-50",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {onToggle && (
            <Checkbox
              checked={isCompleted}
              onCheckedChange={onToggle}
              disabled={!isApplicableToday}
              className="data-[state=checked]:bg-habit data-[state=checked]:border-habit"
            />
          )}

          <div className="flex-1 flex items-center gap-3 min-w-0">
            {habit.icon && <span className="text-2xl flex-shrink-0">{habit.icon}</span>}

            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-medium",
                isCompleted ? "line-through text-muted-foreground" : "text-foreground"
              )}>
                {habit.name}
              </h3>
              {habit.description && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {habit.description}
                </p>
              )}
              {showFrequencyBadge && (
                <Badge variant="outline" className="text-xs mt-2 flex items-center gap-1 w-fit bg-muted/50">
                  <Calendar className="w-3 h-3" />
                  {frequencyLabel}
                </Badge>
              )}
            </div>
          </div>

          {showStreak && currentStreak > 0 && (
            <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-habit/10 flex-shrink-0">
              <Flame className="w-5 h-5 text-habit" />
              <span className="text-lg font-bold text-habit">{currentStreak}</span>
              <span className="text-xs text-muted-foreground">jours</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HabitCard;
