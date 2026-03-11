import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ChevronDown, ChevronUp, Heart, CalendarDays, Flame, Target, CheckCircle2 } from 'lucide-react';
import HabitDeckTabs from '@/components/habits/HabitDeckTabs';
import HabitGrid from '@/components/habits/HabitGrid';
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
            state.viewState === 'success' && data.selectedDeckId ? (
              <Button
                onClick={() => actions.setIsHabitModalOpen(true)}
                className={cn('bg-habit hover:bg-habit-dark', isPhone && 'flex-1 rounded-xl')}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isPhone ? 'Habitude' : 'Nouvelle habitude'}
              </Button>
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
          <div className={cn('grid gap-6', isPhone ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1fr)_320px]')}>
            <div className="space-y-4">
              <Card className="border-border/70 bg-card/85 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Deck et vue du jour</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <HabitDeckTabs
                    decks={data.decks}
                    selectedDeckId={data.selectedDeckId}
                    onSelectDeck={actions.setSelectedDeckId}
                    onManageDecks={() => actions.setIsDeckManagementOpen(true)}
                  />

                  {data.selectedDeckId && (
                    <div className={cn('grid gap-3', isPhone ? 'grid-cols-2' : 'grid-cols-4')}>
                      <HabitMetric label="A faire" value={remainingTodayCount} icon={<CalendarDays className="w-3.5 h-3.5" />} tone="habit" />
                      <HabitMetric label="Complétées" value={todayCompletedCount} icon={<CheckCircle2 className="w-3.5 h-3.5" />} />
                      <HabitMetric label="Streak" value={data.habitStats.bestCurrentStreak} icon={<Flame className="w-3.5 h-3.5" />} />
                      <HabitMetric label="Semaine" value={data.habitStats.weeklyCompletions} icon={<Target className="w-3.5 h-3.5" />} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {data.selectedDeckId && (
                state.habitsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : data.habits.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-lg border border-border">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-4">Aucune habitude dans ce deck</p>
                    <Button
                      onClick={() => actions.setIsHabitModalOpen(true)}
                      variant="outline"
                      className="border-habit text-habit hover:bg-habit/10"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Créer ma première habitude
                    </Button>
                  </div>
                ) : (
                  <HabitGrid
                    habits={data.habits}
                    streaks={data.streaks}
                    isCompletedToday={actions.isCompletedToday}
                    isHabitApplicableToday={actions.isHabitApplicableToday}
                    onToggle={(habitId) => actions.toggleCompletion(habitId)}
                    onEdit={actions.handleEditHabit}
                    onDelete={actions.handleDeleteHabit}
                    showNewHabitZone
                    onNewHabitClick={() => actions.setIsHabitModalOpen(true)}
                  />
                )
              )}
            </div>

            {data.selectedDeckId && (
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
                    <Button
                      onClick={() => actions.setIsHabitModalOpen(true)}
                      variant="outline"
                      className="w-full border-habit/30 text-habit hover:bg-habit/10"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une habitude
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {data.selectedDeckId && !data.habitStats.loading && data.habitStats.totalHabits > 0 && (
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
