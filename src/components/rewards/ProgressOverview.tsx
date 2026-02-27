import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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

  // Find next threshold
  const nextThreshold = POINT_THRESHOLDS.find(t => t > pointsAvailable) ?? POINT_THRESHOLDS[POINT_THRESHOLDS.length - 1];
  const prevThreshold = POINT_THRESHOLDS.filter(t => t <= pointsAvailable).pop() ?? 0;
  const range = nextThreshold - prevThreshold;
  const progressPct = range > 0 ? Math.min(100, Math.round(((pointsAvailable - prevThreshold) / range) * 100)) : 100;

  return (
    <div className="space-y-4">
      {/* Reservoir gauge */}
      <Card className="p-6 bg-gradient-to-br from-reward-light to-background border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Points disponibles</h3>
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground">{pointsAvailable} pts</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Total gagné : {progress.totalPointsEarned ?? 0} · Dépensé : {progress.totalPointsSpent ?? 0}
            </span>
          </div>

          {/* Gauge with thresholds */}
          <div className="space-y-2">
            <Progress value={progressPct} className="h-4" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {POINT_THRESHOLDS.map(t => (
                <span key={t} className={pointsAvailable >= t ? 'text-primary font-semibold' : ''}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-destructive" />
            <div>
              <span className="text-lg font-semibold text-foreground">
                {streakInfo?.currentStreak ?? progress.currentTaskStreak} jours
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                (record : {streakInfo?.longestStreak ?? progress.longestTaskStreak})
              </span>
            </div>
          </div>

          {streakInfo && (
            <div className="text-xs text-muted-foreground">
              {streakInfo.streakQualifiedToday
                ? '✅ Objectif atteint aujourd\'hui'
                : `⏳ ${Math.max(0, STREAK_MIN_IMPORTANT_MINUTES - streakInfo.importantMinutesToday)} min importantes restantes`
              }
            </div>
          )}
        </div>
      </Card>

    </div>
  );
};

function BarRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-foreground w-32 shrink-0">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium text-foreground w-10 text-right">{pct}%</span>
    </div>
  );
}

export default ProgressOverview;
