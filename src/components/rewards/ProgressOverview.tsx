import React from 'react';
import { Card } from '@/components/ui/card';
import { UserProgress } from '@/types/gamification';
import type { DailyStreakInfo } from '@/types/gamification';
import { Trophy, Flame } from 'lucide-react';
import { STREAK_MIN_IMPORTANT_MINUTES, POINT_THRESHOLDS } from '@/lib/rewards/constants';

interface ProgressOverviewProps {
  progress: UserProgress | null;
  streakInfo: DailyStreakInfo | null;
}

const ProgressOverview: React.FC<ProgressOverviewProps> = ({
  progress,
  streakInfo,
}) => {
  if (!progress) return null;

  const pointsAvailable = progress.pointsAvailable ?? 0;
  const maxThreshold = POINT_THRESHOLDS[POINT_THRESHOLDS.length - 1];
  const fillPct = Math.min(100, Math.round((pointsAvailable / maxThreshold) * 100));

  return (
    <Card className="p-4 border-primary/20 h-full flex flex-col items-center justify-between gap-3 w-40">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-semibold text-foreground">Points</h3>
      </div>

      {/* Vertical gauge */}
      <div className="flex items-end gap-3 flex-1">
        <div className="relative flex flex-col items-center">
          {/* Threshold labels on the left */}
          <div className="relative h-48 w-8 bg-muted rounded-full overflow-hidden border border-border">
            {/* Fill from bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-primary rounded-full transition-all duration-700"
              style={{ height: `${fillPct}%` }}
            />
            {/* Threshold marks */}
            {POINT_THRESHOLDS.map(t => {
              const pos = Math.round((t / maxThreshold) * 100);
              return (
                <div
                  key={t}
                  className="absolute left-0 right-0 border-t border-background/50"
                  style={{ bottom: `${pos}%` }}
                />
              );
            })}
          </div>
          {/* Labels beside gauge */}
          <div className="absolute -right-8 h-48 flex flex-col-reverse justify-between">
            {POINT_THRESHOLDS.map(t => (
              <span
                key={t}
                className={`text-[9px] leading-none ${pointsAvailable >= t ? 'text-primary font-bold' : 'text-muted-foreground'}`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Points value */}
      <div className="text-center">
        <span className="text-2xl font-bold text-foreground">{pointsAvailable}</span>
        <p className="text-[10px] text-muted-foreground">pts disponibles</p>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-1.5 text-center">
        <Flame className="w-3.5 h-3.5 text-destructive" />
        <span className="text-xs font-semibold text-foreground">
          {streakInfo?.currentStreak ?? progress.currentTaskStreak}j
        </span>
        <span className="text-[9px] text-muted-foreground">
          (max {streakInfo?.longestStreak ?? progress.longestTaskStreak})
        </span>
      </div>

      {streakInfo && (
        <p className="text-[9px] text-muted-foreground text-center">
          {streakInfo.streakQualifiedToday
            ? '✅ Objectif du jour OK'
            : `⏳ ${Math.max(0, STREAK_MIN_IMPORTANT_MINUTES - streakInfo.importantMinutesToday)} min restantes`
          }
        </p>
      )}

      {/* Earned/Spent summary */}
      <div className="text-[9px] text-muted-foreground text-center">
        Gagné {progress.totalPointsEarned ?? 0} · Dépensé {progress.totalPointsSpent ?? 0}
      </div>
    </Card>
  );
};

export default ProgressOverview;
