import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ChevronDown, ChevronUp, Heart, CalendarDays, Flame, Target, CheckCircle2 } from 'lucide-react';
import HabitDeckContainer from '@/components/habits/HabitDeckContainer';
import TodayProgress from '@/components/habits/TodayProgress';
import HabitStatsCard from '@/components/habits/HabitStatsCard';
import HabitTrendsChart from '@/components/habits/HabitTrendsChart';
import HabitCalendarHeatmap from '@/components/habits/HabitCalendarHeatmap';
import HabitModal from '@/components/habits/HabitModal';
import DeckManagement from '@/components/habits/DeckManagement';
import { ViewLayout } from '@/components/layout/view';
import { useHabitsFullViewData } from '@/hooks/view-data';
import { useApp } from '@/contexts/AppContext';
import { useViewport } from '@/contexts/ViewportContext';
import { cn } from '@/lib/utils';

const HabitMetric: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: 'habit' | 'default';
}> = ({ label, value, icon, tone = 'default' }) => (
  <div className={cn(
    'rounded-2xl border px-4 py-3',
    tone === 'habit' ? 'border-habit/20 bg-habit/8' : 'border-border/70 bg-card/70'
  )}>
    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
      {icon}
      {label}
    </div>
    <div className={cn('mt-2 text-2xl font-semibold', tone === 'habit' ? 'text-habit' : 'text-foreground')}>
      {value}
    </div>
  </div>
);

const HabitsView = () => {
  const { data, state, actions } = useHabitsFullViewData();
  const { contextFilter } = useApp();
  const { isPhone } = useViewport();
  const habitDefaultContext = contextFilter !== 'all' ? (contextFilter as 'Pro' | 'Perso') : undefined;

  const todayCompletedCount = data.todayHabits.filter((habit) => actions.isCompletedToday(habit.id)).length;
  const todayTotalCount = data.todayHabits.length;
  const remainingTodayCount = Math.max(todayTotalCount - todayCompletedCount, 0);

  return (
    <>
      <ViewLayout
        header={{
          title: 'Habitudes',
          subtitle: 'Votre routine du jour, sans surcharge',
          icon: <Heart className="w-5 h-5" />,
          actions:
            state.viewState === 'success' ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => actions.setIsDeckManagementOpen(true)}
                  className="text-muted-foreground"
                >
                  Gérer les decks
                </Button>
              </div>
            ) : undefined,
        }}
        state={state.viewState}
        loadingProps={{ variant: 'cards' }}
        emptyProps={
          state.emptyStateConfig
            ? {
                ...state.emptyStateConfig,
                icon: <Heart className="w-12 h-12" />,
              }
            : undefined
        }
      >
        <div className="space-y-6">
          {/* Metrics row */}
          <div className={cn('grid gap-3', isPhone ? 'grid-cols-2' : 'grid-cols-4')}>
            <HabitMetric label="A faire" value={remainingTodayCount} icon={<CalendarDays className="w-3.5 h-3.5" />} tone="habit" />
            <HabitMetric label="Complétées" value={todayCompletedCount} icon={<CheckCircle2 className="w-3.5 h-3.5" />} />
            <HabitMetric label="Streak" value={data.habitStats.bestCurrentStreak} icon={<Flame className="w-3.5 h-3.5" />} />
            <HabitMetric label="Semaine" value={data.habitStats.weeklyCompletions} icon={<Target className="w-3.5 h-3.5" />} />
          </div>

          {/* Main layout */}
          <div className={cn('grid gap-6', isPhone ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1fr)_320px]')}>
            {/* Deck containers */}
            <div className="space-y-4">
              {data.decks.map(deck => (
                <HabitDeckContainer
                  key={deck.id}
                  deck={deck}
                  habits={data.habitsByDeck[deck.id] || []}
                  streaks={data.streaks}
                  isCompletedToday={actions.isCompletedToday}
                  isHabitApplicableToday={actions.isHabitApplicableToday}
                  onToggle={(habitId) => actions.toggleCompletion(habitId)}
                  onEdit={actions.handleEditHabit}
                  onDelete={actions.handleDeleteHabit}
                  onAddHabit={actions.handleAddHabitToDeck}
                />
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <TodayProgress
                completionRate={actions.getTodayCompletionRate()}
                completedCount={todayCompletedCount}
                totalCount={todayTotalCount}
              />

              <Card className="border-border/70 bg-card/85 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Repères rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                    <span className="text-muted-foreground">Habitudes du jour</span>
                    <span className="font-medium text-foreground">{todayTotalCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                    <span className="text-muted-foreground">Taux sur 30 jours</span>
                    <span className="font-medium text-foreground">{data.habitStats.overallCompletionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                    <span className="text-muted-foreground">Record actuel</span>
                    <span className="font-medium text-foreground">{data.habitStats.longestStreak}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Stats section */}
          {!data.habitStats.loading && data.habitStats.totalHabits > 0 && (
            <div>
              <button
                onClick={() => actions.setShowStats(!state.showStats)}
                className="flex items-center justify-between w-full py-3 px-4 bg-card rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-foreground">Analyses et tendances</span>
                {state.showStats ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {state.showStats && (
                <div className="mt-4 space-y-4">
                  <HabitStatsCard
                    bestCurrentStreak={data.habitStats.bestCurrentStreak}
                    longestStreak={data.habitStats.longestStreak}
                    weeklyCompletions={data.habitStats.weeklyCompletions}
                    overallCompletionRate={data.habitStats.overallCompletionRate}
                  />
                  <div className={cn('grid gap-4', isPhone ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2')}>
                    <HabitTrendsChart dailyTrends={data.habitStats.dailyTrends} />
                    <HabitCalendarHeatmap monthlyData={data.habitStats.monthlyData} />
                  </div>
                </div>
              )}
            </div>
          )}

          <HabitModal
            isOpen={state.isHabitModalOpen}
            onClose={actions.handleCloseHabitModal}
            onSave={actions.handleHabitSave}
            habit={data.editingHabit}
            defaultContext={habitDefaultContext}
          />
        </div>
      </ViewLayout>

      <DeckManagement
        isOpen={state.isDeckManagementOpen}
        onClose={() => actions.setIsDeckManagementOpen(false)}
        decks={data.decks}
        onCreateDeck={actions.handleCreateDeck}
        onUpdateDeck={actions.updateDeck}
        onDeleteDeck={actions.deleteDeck}
      />
    </>
  );
};

export default HabitsView;
