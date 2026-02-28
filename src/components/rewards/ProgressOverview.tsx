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
    <Card className="p-3 border-primary/20 h-full w-full min-w-[160px] flex flex-col">
      {/* Header compact */}
      <div className="flex items-center gap-1.5 mb-2 shrink-0">
        <Trophy className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Points</h3>
      </div>

      {/* Body: gauge + info, fills all remaining height */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Gauge column — stretches vertically */}
        <div className="relative shrink-0 flex">
          <div className="relative w-7 bg-muted rounded-full overflow-hidden border border-border flex-1">
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
          {/* Threshold labels — aligned to gauge height */}
          <div className="absolute left-9 top-0 bottom-0 flex flex-col-reverse justify-between py-0.5">
            {POINT_THRESHOLDS.map(t => (
              <span
                key={t}
                className={`text-[10px] leading-none whitespace-nowrap ${pointsAvailable >= t ? 'text-primary font-bold' : 'text-muted-foreground'}`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Info column — fills height, content spread vertically */}
        <div className="flex flex-col justify-between min-w-0 flex-1 pl-4 py-0.5">
          <div>
            <span className="text-3xl font-bold text-foreground leading-none">{pointsAvailable}</span>
            <p className="text-xs text-muted-foreground mt-0.5">pts disponibles</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-sm font-semibold text-foreground">
                {streakInfo?.currentStreak ?? progress.currentTaskStreak}j
              </span>
              <span className="text-xs text-muted-foreground">
                (max {streakInfo?.longestStreak ?? progress.longestTaskStreak})
              </span>
            </div>

            {streakInfo && (
              <p className="text-xs text-muted-foreground leading-snug">
                {streakInfo.streakQualifiedToday
                  ? '✅ Objectif OK'
                  : `⏳ ${Math.max(0, STREAK_MIN_IMPORTANT_MINUTES - streakInfo.importantMinutesToday)} min restantes`
                }
              </p>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground leading-tight">
            Gagné {progress.totalPointsEarned ?? 0} · Dépensé {progress.totalPointsSpent ?? 0}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ProgressOverview;
