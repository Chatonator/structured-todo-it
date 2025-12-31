import React from 'react';
import { Card } from '@/components/ui/card';
import { UserProgress } from '@/types/gamification';
import { Trophy, Star, Flame } from 'lucide-react';

interface ProgressOverviewProps {
  progress: UserProgress | null;
  progressPercentage: number;
}

const ProgressOverview: React.FC<ProgressOverviewProps> = ({
  progress,
  progressPercentage
}) => {
  if (!progress) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-6 bg-gradient-to-br from-reward-light to-white border-reward/20">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-reward-dark" />
              <h3 className="text-xl font-bold text-reward-foreground">Niveau {progress.currentLevel}</h3>
            </div>
            <span className="text-sm font-medium text-reward-foreground">
              {progress.totalXp} / {progress.xpForNextLevel} XP
            </span>
          </div>

          <div className="w-full bg-reward/10 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-reward-dark to-reward transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <p className="text-sm text-reward-foreground/70">
            {Math.ceil(progress.xpForNextLevel - progress.totalXp)} XP jusqu'au niveau {progress.currentLevel + 1}
          </p>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-purple-100 to-white">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-purple-600">{progress.currentPoints} Points</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-muted-foreground">Série: {progress.currentTaskStreak} jours</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-muted-foreground">{progress.tasksCompleted} tâches</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProgressOverview;
