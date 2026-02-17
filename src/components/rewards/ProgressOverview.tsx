import React from 'react';
import { Card } from '@/components/ui/card';
import { UserProgress } from '@/types/gamification';
import type { WeeklySummary } from '@/lib/rewards';
import type { DailyStreakInfo } from '@/types/gamification';
import { Trophy, Flame, Target, BarChart3 } from 'lucide-react';
import { MICRO_TASK_DAILY_CAP } from '@/lib/rewards/constants';

interface ProgressOverviewProps {
  progress: UserProgress | null;
  weeklySummary: WeeklySummary | null;
  streakInfo: DailyStreakInfo | null;
  dailyMicroCount: number;
}

const ProgressOverview: React.FC<ProgressOverviewProps> = ({
  progress,
  weeklySummary,
  streakInfo,
  dailyMicroCount,
}) => {
  if (!progress) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Points totaux + Streak */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-background border-primary/20">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-foreground">{progress.totalXp} Points</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              {progress.tasksCompleted} tâches
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Flame className="w-5 h-5 text-orange-500" />
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
                : `⏳ ${Math.max(0, 30 - streakInfo.importantMinutesToday)} min importantes restantes`
              }
            </div>
          )}
        </div>
      </Card>

      {/* Score d'alignement + Micro-tâches */}
      <Card className="p-6 bg-gradient-to-br from-accent/30 to-background">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">
              Alignement : {weeklySummary?.alignmentScore ?? 0}%
            </h3>
          </div>

          <p className="text-xs text-muted-foreground">
            Ratio points Important (non urgent) / total cette semaine
          </p>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Micro-tâches :</span>
            <span className="font-medium text-foreground">
              {dailyMicroCount}/{MICRO_TASK_DAILY_CAP}
            </span>
          </div>
        </div>
      </Card>

      {/* Résumé hebdomadaire */}
      {weeklySummary && weeklySummary.totalMinutes > 0 && (
        <Card className="p-6 md:col-span-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Répartition hebdo</h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {weeklySummary.totalMinutes} min · {weeklySummary.totalPoints} pts
              </span>
            </div>

            <div className="space-y-2">
              <BarRow
                label="⭐ Important (non urgent)"
                pct={weeklySummary.pctImportantNotUrgent}
                color="bg-emerald-500"
              />
              <BarRow
                label="⚡ Urgent"
                pct={weeklySummary.pctUrgent}
                color="bg-orange-500"
              />
              <BarRow
                label="🔧 Maintenance"
                pct={weeklySummary.pctMaintenance}
                color="bg-muted-foreground/50"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

function BarRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-foreground w-48 shrink-0">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-foreground w-10 text-right">{pct}%</span>
    </div>
  );
}

export default ProgressOverview;
