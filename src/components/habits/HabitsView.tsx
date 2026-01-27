import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { useDecks } from '@/hooks/useDecks';
import { useHabits } from '@/hooks/useHabits';
import { useHabitStats } from '@/hooks/useHabitStats';
import DeckSelector from './DeckSelector';
import TodayProgress from './TodayProgress';
import HabitStatsCard from './HabitStatsCard';
import HabitTrendsChart from './HabitTrendsChart';
import HabitCalendarHeatmap from './HabitCalendarHeatmap';
import HabitItem from './HabitItem';
import HabitModal from './HabitModal';
import DeckManagement from './DeckManagement';
import { Habit } from '@/types/habit';
import { ViewLayout } from '@/components/layout/view';

const HabitsView = () => {
  const { decks, loading: decksLoading, defaultDeckId, createDeck, updateDeck, deleteDeck } = useDecks();
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(defaultDeckId);
  const { habits, loading: habitsLoading, toggleCompletion, createHabit, updateHabit, deleteHabit, isCompletedToday, isHabitApplicableToday, getHabitsForToday, getTodayCompletionRate, streaks } = useHabits(selectedDeckId);
  const habitStats = useHabitStats();
  
  const todayHabits = getHabitsForToday();
  
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isDeckManagementOpen, setIsDeckManagementOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showStats, setShowStats] = useState(false);

  React.useEffect(() => {
    if (defaultDeckId && !selectedDeckId) {
      setSelectedDeckId(defaultDeckId);
    }
  }, [defaultDeckId, selectedDeckId]);

  const handleHabitSave = async (habit: Omit<Habit, 'id' | 'createdAt'>) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, habit);
    } else {
      await createHabit(habit);
    }
    setIsHabitModalOpen(false);
    setEditingHabit(null);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsHabitModalOpen(true);
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette habitude ?')) {
      await deleteHabit(habitId);
    }
  };

  // Determine state - empty when no decks
  const viewState = decksLoading ? 'loading' : (decks.length === 0 ? 'empty' : 'success');

  // Empty state config
  const emptyStateConfig = decks.length === 0 ? {
    title: "Aucun deck d'habitudes",
    description: "Créez votre premier deck pour commencer à suivre vos habitudes",
    icon: <Heart className="w-12 h-12" />,
    action: {
      label: "Créer mon premier deck",
      onClick: () => setIsDeckManagementOpen(true)
    }
  } : undefined;

  const selectedDeck = decks.find(d => d.id === selectedDeckId);

  // Handler for creating deck that auto-selects it
  const handleCreateDeck = async (deck: Omit<typeof decks[0], 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newDeckId = await createDeck(deck);
    if (newDeckId) {
      setSelectedDeckId(newDeckId);
      setIsDeckManagementOpen(false);
    }
    return newDeckId;
  };

  return (
    <>
      <ViewLayout
        header={{
          title: "Habitudes",
          subtitle: "Suivez vos habitudes quotidiennes",
          icon: <Heart className="w-5 h-5" />,
          actions: viewState === 'success' && selectedDeckId ? (
            <Button
              onClick={() => setIsHabitModalOpen(true)}
              size="sm"
              className="bg-habit hover:bg-habit-dark"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          ) : undefined
        }}
        state={viewState}
        loadingProps={{ variant: 'list' }}
        emptyProps={emptyStateConfig}
      >
        <div className="max-w-4xl mx-auto space-y-4 pb-20 md:pb-6">
          {/* Sélecteur de deck */}
          <div>
            <DeckSelector
              decks={decks}
              selectedDeckId={selectedDeckId}
              onSelectDeck={setSelectedDeckId}
              onManageDecks={() => setIsDeckManagementOpen(true)}
            />
          </div>

          {selectedDeckId && (
            <>
              {/* Progression du jour */}
              <TodayProgress
                completionRate={getTodayCompletionRate()}
                completedCount={todayHabits.filter(h => isCompletedToday(h.id)).length}
                totalCount={todayHabits.length}
              />

              {/* Liste des habitudes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedDeck?.name || 'Mes habitudes'}
                  </h2>
                </div>

                {habitsLoading ? (
                  <p className="text-center text-muted-foreground py-8">Chargement des habitudes...</p>
                ) : habits.length === 0 ? (
                  <div className="text-center py-8 bg-card rounded-lg border border-border">
                    <p className="text-muted-foreground mb-4">Aucune habitude dans ce deck</p>
                    <Button
                      onClick={() => setIsHabitModalOpen(true)}
                      variant="outline"
                      className="border-habit text-habit hover:bg-habit/10"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Créer ma première habitude
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {habits.map(habit => (
                      <HabitItem
                        key={habit.id}
                        habit={habit}
                        isCompleted={isCompletedToday(habit.id)}
                        streak={streaks[habit.id]}
                        isApplicableToday={isHabitApplicableToday(habit)}
                        onToggle={() => toggleCompletion(habit.id)}
                        onEdit={() => handleEditHabit(habit)}
                        onDelete={() => handleDeleteHabit(habit.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Section Statistiques - Collapsible */}
              {!habitStats.loading && habitStats.totalHabits > 0 && (
                <div>
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className="flex items-center justify-between w-full py-3 px-4 bg-card rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium text-foreground">Statistiques</span>
                    {showStats ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  
                  {showStats && (
                    <div className="mt-4 space-y-4">
                      <HabitStatsCard
                        bestCurrentStreak={habitStats.bestCurrentStreak}
                        longestStreak={habitStats.longestStreak}
                        weeklyCompletions={habitStats.weeklyCompletions}
                        overallCompletionRate={habitStats.overallCompletionRate}
                      />
                      <HabitTrendsChart dailyTrends={habitStats.dailyTrends} />
                      <HabitCalendarHeatmap monthlyData={habitStats.monthlyData} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <HabitModal
            isOpen={isHabitModalOpen}
            onClose={() => {
              setIsHabitModalOpen(false);
              setEditingHabit(null);
            }}
            onSave={handleHabitSave}
            habit={editingHabit}
          />
        </div>
      </ViewLayout>

      {/* Modals must be OUTSIDE ViewLayout to be visible during empty state */}
      <DeckManagement
        isOpen={isDeckManagementOpen}
        onClose={() => setIsDeckManagementOpen(false)}
        decks={decks}
        onCreateDeck={handleCreateDeck}
        onUpdateDeck={updateDeck}
        onDeleteDeck={deleteDeck}
      />
    </>
  );
};

export default HabitsView;
