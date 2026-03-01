import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronUp, Heart } from 'lucide-react';
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

const HabitsView = () => {
  const { data, state, actions } = useHabitsFullViewData();

  return (
    <>
      <ViewLayout
        header={{
          title: "Habitudes",
          subtitle: "Suivez vos habitudes quotidiennes",
          icon: <Heart className="w-5 h-5" />,
          actions: state.viewState === 'success' && data.selectedDeckId ? (
            <Button
              onClick={() => actions.setIsHabitModalOpen(true)}
              className="bg-habit hover:bg-habit-dark"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle habitude
            </Button>
          ) : undefined
        }}
        state={state.viewState}
        loadingProps={{ variant: 'cards' }}
        emptyProps={state.emptyStateConfig ? {
          ...state.emptyStateConfig,
          icon: <Heart className="w-12 h-12" />
        } : undefined}
      >
        <div className="space-y-6">
          <HabitDeckTabs
            decks={data.decks}
            selectedDeckId={data.selectedDeckId}
            onSelectDeck={actions.setSelectedDeckId}
            onManageDecks={() => actions.setIsDeckManagementOpen(true)}
          />

          {data.selectedDeckId && (
            <>
              <TodayProgress
                completionRate={actions.getTodayCompletionRate()}
                completedCount={data.todayHabits.filter(h => actions.isCompletedToday(h.id)).length}
                totalCount={data.todayHabits.length}
              />

              {state.habitsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
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
              )}

              {!data.habitStats.loading && data.habitStats.totalHabits > 0 && (
                <div>
                  <button
                    onClick={() => actions.setShowStats(!state.showStats)}
                    className="flex items-center justify-between w-full py-3 px-4 bg-card rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium text-foreground">Statistiques</span>
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
                      <HabitTrendsChart dailyTrends={data.habitStats.dailyTrends} />
                      <HabitCalendarHeatmap monthlyData={data.habitStats.monthlyData} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <HabitModal
            isOpen={state.isHabitModalOpen}
            onClose={actions.handleCloseHabitModal}
            onSave={actions.handleHabitSave}
            habit={data.editingHabit}
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
