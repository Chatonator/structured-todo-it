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
    <Card className="p-3 border-primary/20 h-full w-full min-w-[160px]">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <Trophy className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Points</h3>
      </div>

      {/* Gauge + Info side by side */}
      <div className="flex gap-3 items-center">
        {/* Gauge column */}
        <div className="relative shrink-0 flex items-center">
          <div className="relative h-36 w-6 bg-muted rounded-full overflow-hidden border border-border">
            <div
              className="absolute bottom-0 left-0 right-0 bg-primary rounded-full transition-all duration-700"
              style={{ height: `${fillPct}%` }}
            />
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
          {/* Threshold labels */}
          <div className="absolute left-8 h-36 flex flex-col-reverse justify-between">
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

        {/* Info column */}
        <div className="flex flex-col gap-1.5 min-w-0 pl-6">
          <div>
            <span className="text-2xl font-bold text-foreground leading-none">{pointsAvailable}</span>
            <p className="text-[10px] text-muted-foreground leading-tight">pts disponibles</p>
          </div>

          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-destructive shrink-0" />
            <span className="text-xs font-semibold text-foreground">
              {streakInfo?.currentStreak ?? progress.currentTaskStreak}j
            </span>
            <span className="text-[9px] text-muted-foreground">
              (max {streakInfo?.longestStreak ?? progress.longestTaskStreak})
            </span>
          </div>

          {streakInfo && (
            <p className="text-[9px] text-muted-foreground leading-tight">
              {streakInfo.streakQualifiedToday
                ? '✅ Objectif OK'
                : `⏳ ${Math.max(0, STREAK_MIN_IMPORTANT_MINUTES - streakInfo.importantMinutesToday)} min restantes`
              }
            </p>
          )}

          <p className="text-[9px] text-muted-foreground leading-tight">
            Gagné {progress.totalPointsEarned ?? 0} · Dépensé {progress.totalPointsSpent ?? 0}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ProgressOverview;
