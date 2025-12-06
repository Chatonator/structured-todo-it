import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Flame, Target, Calendar } from 'lucide-react';

interface HabitStatsCardProps {
  bestCurrentStreak: number;
  longestStreak: number;
  weeklyCompletions: number;
  overallCompletionRate: number;
}

const HabitStatsCard: React.FC<HabitStatsCardProps> = ({
  bestCurrentStreak,
  longestStreak,
  weeklyCompletions,
  overallCompletionRate
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <Card className="bg-habit-light dark:bg-habit/20 border-habit/20">
        <CardContent className="p-4 text-center">
          <Flame className="w-5 h-5 text-habit mx-auto mb-1" />
          <div className="text-2xl font-bold text-habit">{bestCurrentStreak}</div>
          <div className="text-xs text-muted-foreground">Streak actuel</div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4 text-center">
          <Target className="w-5 h-5 text-reward mx-auto mb-1" />
          <div className="text-2xl font-bold text-reward">{longestStreak}</div>
          <div className="text-xs text-muted-foreground">Record streak</div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4 text-center">
          <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
          <div className="text-2xl font-bold text-foreground">{weeklyCompletions}</div>
          <div className="text-xs text-muted-foreground">Cette semaine</div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4 text-center">
          <TrendingUp className="w-5 h-5 text-system-success mx-auto mb-1" />
          <div className="text-2xl font-bold text-system-success">{overallCompletionRate}%</div>
          <div className="text-xs text-muted-foreground">Taux (30j)</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HabitStatsCard;
