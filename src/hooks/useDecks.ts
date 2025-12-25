import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Deck } from '@/types/habit';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export const useDecks = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultDeckId, setDefaultDeckId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadDecks = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', user.id)
        .order('order', { ascending: true });

      if (error) throw error;

      const formattedDecks: Deck[] = (data || []).map(d => ({
        id: d.id,
        userId: d.user_id,
        name: d.name,
        category: (d.category as Deck['category']) || 'Quotidien',
        context: (d.context as Deck['context']) || 'Perso',
        estimatedTime: d.estimatedTime || 30,
        description: d.description,
        color: d.color || '#ec4899',
        icon: d.icon,
        isDefault: d.is_default,
        order: d.order,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at)
      }));

      setDecks(formattedDecks);
      
      const defaultDeck = formattedDecks.find(d => d.isDefault);
      if (defaultDeck) {
        setDefaultDeckId(defaultDeck.id);
      } else if (formattedDecks.length > 0) {
        setDefaultDeckId(formattedDecks[0].id);
      }
    } catch (error: any) {
      logger.error('Failed to load decks', { error: error.message });
      toast({
        title: "Erreur",
        description: "Impossible de charger les decks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createDeck = useCallback(async (deck: Omit<Deck, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('decks')
        .insert({
          user_id: user.id,
          name: deck.name,
          category: deck.category || 'Quotidien',
          context: deck.context || 'Perso',
          estimatedTime: deck.estimatedTime || 30,
          description: deck.description,
          color: deck.color || '#ec4899',
          icon: deck.icon,
          is_default: deck.isDefault,
          order: deck.order
        })
        .select()
        .single();

      if (error) throw error;

      await loadDecks();
      return data.id;
    } catch (error: any) {
      logger.error('Failed to create deck', { error: error.message });
      toast({
        title: "Erreur",
        description: "Impossible de créer le deck",
        variant: "destructive"
      });
      return null;
    }
  }, [user, loadDecks, toast]);

  const updateDeck = useCallback(async (deckId: string, updates: Partial<Deck>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('decks')
        .update({
          name: updates.name,
          category: updates.category,
          context: updates.context,
          estimatedTime: updates.estimatedTime,
          description: updates.description,
          color: updates.color,
          icon: updates.icon,
          is_default: updates.isDefault,
          order: updates.order
        })
        .eq('id', deckId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadDecks();
      return true;
    } catch (error: any) {
      logger.error('Failed to update deck', { error: error.message });
      return false;
    }
  }, [user, loadDecks]);

  const deleteDeck = useCallback(async (deckId: string) => {
    if (!user) return false;

    try {
      // First, delete all habits associated with this deck
      const { error: habitsError } = await supabase
        .from('habits')
        .delete()
        .eq('deck_id', deckId)
        .eq('user_id', user.id);

      if (habitsError) throw habitsError;

      // Then delete the deck itself
      const { error: deckError } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId)
        .eq('user_id', user.id);

      if (deckError) throw deckError;

      toast({
        title: "Deck supprimé",
        description: "Le deck et ses habitudes ont été supprimés avec succès"
      });

      await loadDecks();
      return true;
    } catch (error: any) {
      logger.error('Failed to delete deck', { error: error.message });
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le deck",
        variant: "destructive"
      });
      return false;
    }
  }, [user, loadDecks, toast]);

  const setDefaultDeck = useCallback(async (deckId: string) => {
    if (!user) return false;

    try {
      await supabase
        .from('decks')
        .update({ is_default: false })
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('decks')
        .update({ is_default: true })
        .eq('id', deckId)
        .eq('user_id', user.id);

      if (error) throw error;

      setDefaultDeckId(deckId);
      await loadDecks();
      return true;
    } catch (error: any) {
      logger.error('Failed to set default deck', { error: error.message });
      return false;
    }
  }, [user, loadDecks]);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  return {
    decks,
    loading,
    defaultDeckId,
    createDeck,
    updateDeck,
    deleteDeck,
    setDefaultDeck,
    reloadDecks: loadDecks
  };
};
