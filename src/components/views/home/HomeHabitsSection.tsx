import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, ArrowRight, Flame, CheckCircle } from 'lucide-react';
import { Habit, HabitStreak } from '@/types/habit';

interface HomeHabitsSectionProps {
  habits: Habit[];
  completions: Record<string, boolean>;
  streaks: Record<string, HabitStreak>;
  onToggle: (habitId: string) => void;
  onViewAll: () => void;
  loading?: boolean;
}

const HomeHabitsSection: React.FC<HomeHabitsSectionProps> = ({
  habits,
  completions,
  streaks,
  onToggle,
  onViewAll,
  loading
}) => {
  const uncompleted = habits.filter(h => !completions[h.id]);
  const completedCount = habits.filter(h => completions[h.id]).length;
  const allCompleted = uncompleted.length === 0 && habits.length > 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-habit" />
            Habitudes du jour
            {habits.length > 0 && (
              <Badge variant="outline" className="ml-2 bg-habit/10 text-habit border-habit/20">
                {completedCount}/{habits.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="text-xs"
          >
            Toutes les habitudes
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Chargement...
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Aucune habitude définie
          </div>
        ) : allCompleted ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-system-success mx-auto mb-3" />
            <p className="text-lg font-semibold text-foreground mb-1">Bravo !</p>
            <p className="text-sm text-muted-foreground">
              Toutes les habitudes du jour sont complétées 🎉
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {uncompleted.slice(0, 5).map(habit => {
              const streak = streaks[habit.id];
              const currentStreak = streak?.currentStreak || 0;

              return (
                <div
                  key={habit.id}
                  className="flex items-center gap-3 p-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors group"
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => onToggle(habit.id)}
                    className="border-habit data-[state=checked]:bg-habit data-[state=checked]:border-habit"
                  />
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-habit-light dark:bg-habit/20">
                    {habit.icon || '💪'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{habit.name}</p>
                    {habit.description && (
                      <p className="text-xs text-muted-foreground truncate">{habit.description}</p>
                    )}
                  </div>
                  {currentStreak > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1 bg-habit/10 text-habit border-habit/20">
                      <Flame className="w-3 h-3" />
                      {currentStreak}
                    </Badge>
                  )}
                </div>
              );
            })}
            {uncompleted.length > 5 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                +{uncompleted.length - 5} autres habitudes
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HomeHabitsSection;
