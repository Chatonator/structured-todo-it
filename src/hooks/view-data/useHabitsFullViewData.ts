import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDecks } from '@/hooks/useDecks';
import { useHabits } from '@/hooks/useHabits';
import { useHabitStats } from '@/hooks/useHabitStats';
import { Habit } from '@/types/habit';
import type { ViewState } from '@/components/layout/view/ViewLayout';

/**
 * Hook complet pour la vue Habitudes
 * Suit le pattern { data, state, actions } pour cohérence avec les autres vues
 */
export const useHabitsFullViewData = () => {
  const { decks, loading: decksLoading, defaultDeckId, createDeck, updateDeck, deleteDeck } = useDecks();
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(defaultDeckId);
  const {
    habits, loading: habitsLoading, toggleCompletion, createHabit, updateHabit, deleteHabit,
    isCompletedToday, isHabitApplicableToday, getHabitsForToday, getTodayCompletionRate, streaks
  } = useHabits(selectedDeckId);
  const habitStats = useHabitStats();

  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isDeckManagementOpen, setIsDeckManagementOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Auto-select default deck
  useEffect(() => {
    if (defaultDeckId && !selectedDeckId) {
      setSelectedDeckId(defaultDeckId);
    }
  }, [defaultDeckId, selectedDeckId]);

  const todayHabits = getHabitsForToday();

  const viewState: ViewState = decksLoading ? 'loading' : (decks.length === 0 ? 'empty' : 'success');

  const handleHabitSave = useCallback(async (habit: Omit<Habit, 'id' | 'createdAt'>) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, habit);
    } else {
      await createHabit(habit);
    }
    setIsHabitModalOpen(false);
    setEditingHabit(null);
  }, [editingHabit, updateHabit, createHabit]);

  const handleEditHabit = useCallback((habit: Habit) => {
    setEditingHabit(habit);
    setIsHabitModalOpen(true);
  }, []);

  const handleDeleteHabit = useCallback(async (habitId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette habitude ?')) {
      await deleteHabit(habitId);
    }
  }, [deleteHabit]);

  const handleCreateDeck = useCallback(async (deck: Omit<typeof decks[0], 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newDeckId = await createDeck(deck);
    if (newDeckId) {
      setSelectedDeckId(newDeckId);
      setIsDeckManagementOpen(false);
    }
    return newDeckId;
  }, [createDeck]);

  const handleCloseHabitModal = useCallback(() => {
    setIsHabitModalOpen(false);
    setEditingHabit(null);
  }, []);

  const emptyStateConfig = useMemo(() => decks.length === 0 ? {
    title: "Aucun deck d'habitudes",
    description: "Créez votre premier deck pour commencer à suivre vos habitudes",
    action: {
      label: "Créer mon premier deck",
      onClick: () => setIsDeckManagementOpen(true)
    }
  } : undefined, [decks.length]);

  return {
    data: {
      decks,
      habits,
      todayHabits,
      streaks,
      habitStats,
      selectedDeckId,
      editingHabit,
    },
    state: {
      viewState,
      habitsLoading,
      isHabitModalOpen,
      isDeckManagementOpen,
      showStats,
      emptyStateConfig,
    },
    actions: {
      setSelectedDeckId,
      setIsHabitModalOpen,
      setIsDeckManagementOpen,
      setShowStats,
      handleHabitSave,
      handleEditHabit,
      handleDeleteHabit,
      handleCreateDeck,
      handleCloseHabitModal,
      toggleCompletion,
      isCompletedToday,
      isHabitApplicableToday,
      getTodayCompletionRate,
      updateDeck,
      deleteDeck,
    },
  };
};

export type HabitsFullViewDataReturn = ReturnType<typeof useHabitsFullViewData>;
