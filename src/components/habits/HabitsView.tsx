import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useDecks } from '@/hooks/useDecks';
import { useHabits } from '@/hooks/useHabits';
import DeckSelector from './DeckSelector';
import TodayProgress from './TodayProgress';
import HabitItem from './HabitItem';
import HabitModal from './HabitModal';
import DeckManagement from './DeckManagement';
import { Habit } from '@/types/habit';

const HabitsView = () => {
  const { decks, loading: decksLoading, defaultDeckId, createDeck, updateDeck, deleteDeck } = useDecks();
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(defaultDeckId);
  const { habits, loading: habitsLoading, toggleCompletion, createHabit, updateHabit, deleteHabit, isCompletedToday, getTodayCompletionRate, streaks } = useHabits(selectedDeckId);
  
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isDeckManagementOpen, setIsDeckManagementOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

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

  if (decksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Aucun deck d'habitudes</h2>
          <p className="text-muted-foreground mb-6">Créez votre premier deck pour commencer à suivre vos habitudes</p>
        </div>
        <Button onClick={() => setIsDeckManagementOpen(true)} className="bg-habit hover:bg-habit-dark">
          <Plus className="w-4 h-4 mr-2" />
          Créer mon premier deck
        </Button>
        <DeckManagement
          isOpen={isDeckManagementOpen}
          onClose={() => setIsDeckManagementOpen(false)}
          decks={decks}
          onCreateDeck={createDeck}
          onUpdateDeck={updateDeck}
          onDeleteDeck={deleteDeck}
        />
      </div>
    );
  }

  const selectedDeck = decks.find(d => d.id === selectedDeckId);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <DeckSelector
            decks={decks}
            selectedDeckId={selectedDeckId}
            onSelectDeck={setSelectedDeckId}
            onManageDecks={() => setIsDeckManagementOpen(true)}
          />
        </div>

        {selectedDeckId && (
          <>
            <TodayProgress
              completionRate={getTodayCompletionRate()}
              completedCount={habits.filter(h => isCompletedToday(h.id)).length}
              totalCount={habits.length}
            />

            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {selectedDeck?.name || 'Mes habitudes'}
                </h2>
                <Button
                  onClick={() => setIsHabitModalOpen(true)}
                  size="sm"
                  className="bg-habit hover:bg-habit-dark"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              {habitsLoading ? (
                <p className="text-center text-muted-foreground py-8">Chargement des habitudes...</p>
              ) : habits.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg border border-border">
                  <p className="text-muted-foreground mb-4">Aucune habitude dans ce deck</p>
                  <Button
                    onClick={() => setIsHabitModalOpen(true)}
                    variant="outline"
                    className="border-habit text-habit hover:bg-habit-light"
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
                      onToggle={() => toggleCompletion(habit.id)}
                      onEdit={() => handleEditHabit(habit)}
                      onDelete={() => handleDeleteHabit(habit.id)}
                    />
                  ))}
                </div>
              )}
            </div>
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

        <DeckManagement
          isOpen={isDeckManagementOpen}
          onClose={() => setIsDeckManagementOpen(false)}
          decks={decks}
          onCreateDeck={createDeck}
          onUpdateDeck={updateDeck}
          onDeleteDeck={deleteDeck}
        />
      </div>
    </div>
  );
};

export default HabitsView;
