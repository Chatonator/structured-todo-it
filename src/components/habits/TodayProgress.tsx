import React from 'react';
import { Card } from '@/components/ui/card';

interface TodayProgressProps {
  completionRate: number;
  completedCount: number;
  totalCount: number;
}

const getMotivationalMessage = (rate: number) => {
  if (rate === 0) return "Commencez votre journée ! 🌅";
  if (rate < 50) return "Continuez comme ça ! 💪";
  if (rate < 100) return "Presque terminé ! 🎯";
  return "Bravo ! Journée parfaite ! 🎉";
};

const TodayProgress: React.FC<TodayProgressProps> = ({
  completionRate,
  completedCount,
  totalCount
}) => {
  return (
    <Card className="p-6 bg-gradient-to-r from-habit-light to-white dark:from-habit-dark/20 dark:to-background border-habit/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Aujourd'hui
          </h3>
          <span className="text-2xl font-bold text-habit">
            {completionRate}%
          </span>
        </div>

        <div className="w-full bg-border rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-habit transition-all duration-500 ease-out"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {completedCount} / {totalCount} habitudes complétées
          </span>
          <span className="text-habit font-medium">
            {getMotivationalMessage(completionRate)}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default TodayProgress;
