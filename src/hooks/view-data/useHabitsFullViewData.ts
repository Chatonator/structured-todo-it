import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDecks } from '@/hooks/useDecks';
import { useHabits } from '@/hooks/useHabits';
import { useHabitStats } from '@/hooks/useHabitStats';
import { Habit } from '@/types/habit';
import type { ViewState } from '@/components/layout/view/ViewLayout';

/**
 * Hook complet pour la vue Habitudes — charge TOUTES les habitudes et les groupe par deck
 */
export const useHabitsFullViewData = () => {
  const { decks, loading: decksLoading, defaultDeckId, createDeck, updateDeck, deleteDeck } = useDecks();

  // Load ALL habits (no deck filter)
  const {
    habits, loading: habitsLoading, toggleCompletion, createHabit, updateHabit, deleteHabit,
    isCompletedToday, isHabitApplicableToday, getHabitsForToday, getTodayCompletionRate, streaks
  } = useHabits(undefined as unknown as string | null);

  const habitStats = useHabitStats();

  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isDeckManagementOpen, setIsDeckManagementOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [addToDeckId, setAddToDeckId] = useState<string | null>(null);

  // Group habits by deckId
  const habitsByDeck = useMemo(() => {
    const map: Record<string, Habit[]> = {};
    for (const deck of decks) {
      map[deck.id] = [];
    }
    for (const habit of habits) {
      const did = habit.deckId;
      if (did && map[did]) {
        map[did].push(habit);
      }
    }
    return map;
  }, [habits, decks]);

  const todayHabits = getHabitsForToday();
  const viewState: ViewState = decksLoading ? 'loading' : (decks.length === 0 ? 'empty' : 'success');

  const handleHabitSave = useCallback(async (habit: Omit<Habit, 'id' | 'createdAt'>) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, habit);
    } else {
      // Use addToDeckId if set
      const habitWithDeck = addToDeckId ? { ...habit, deckId: addToDeckId } : habit;
      await createHabit(habitWithDeck);
    }
    setIsHabitModalOpen(false);
    setEditingHabit(null);
    setAddToDeckId(null);
  }, [editingHabit, updateHabit, createHabit, addToDeckId]);

  const handleEditHabit = useCallback((habit: Habit) => {
    setEditingHabit(habit);
    setIsHabitModalOpen(true);
  }, []);

  const handleDeleteHabit = useCallback(async (habitId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette habitude ?')) {
      await deleteHabit(habitId);
    }
  }, [deleteHabit]);

  const handleAddHabitToDeck = useCallback((deckId: string) => {
    setAddToDeckId(deckId);
    setEditingHabit(null);
    setIsHabitModalOpen(true);
  }, []);

  const handleCreateDeck = useCallback(async (deck: Omit<typeof decks[0], 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newDeckId = await createDeck(deck);
    if (newDeckId) {
      setIsDeckManagementOpen(false);
    }
    return newDeckId;
  }, [createDeck]);

  const handleCloseHabitModal = useCallback(() => {
    setIsHabitModalOpen(false);
    setEditingHabit(null);
    setAddToDeckId(null);
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
      habitsByDeck,
      todayHabits,
      streaks,
      habitStats,
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
      setIsHabitModalOpen,
      setIsDeckManagementOpen,
      setShowStats,
      handleHabitSave,
      handleEditHabit,
      handleDeleteHabit,
      handleAddHabitToDeck,
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
