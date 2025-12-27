// ============= Decks Hook (unified items wrapper) =============
// This hook wraps useItems to provide backward-compatible Deck operations
// All data is now stored in the unified 'items' table

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useItems } from './useItems';
import { useToast } from './use-toast';
import { Deck } from '@/types/habit';
import { Item, ItemMetadata } from '@/types/item';

// Convert Item to Deck for backward compatibility
function itemToDeck(item: Item): Deck {
  const meta = item.metadata || {};
  return {
    id: item.id,
    userId: item.userId,
    name: item.name,
    category: (meta.category as Deck['category']) || 'Quotidien',
    context: (meta.context as Deck['context']) || 'Perso',
    estimatedTime: (meta.estimatedTime as number) || 30,
    description: meta.description as string | undefined,
    color: (meta.color as string) || '#ec4899',
    icon: meta.icon as string | undefined,
    isDefault: (meta.isDefault as boolean) || false,
    order: item.orderIndex,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// Convert Deck to Item metadata
function deckToItemMetadata(deck: Partial<Deck>): Partial<ItemMetadata> {
  return {
    category: deck.category || 'Quotidien',
    context: deck.context || 'Perso',
    estimatedTime: deck.estimatedTime || 30,
    description: deck.description,
    color: deck.color,
    icon: deck.icon,
    isDefault: deck.isDefault,
  };
}

export const useDecks = () => {
  const { 
    items, 
    loading, 
    createItem, 
    updateItem, 
    deleteItem,
    reload 
  } = useItems({ contextTypes: ['deck'] });
  
  const { toast } = useToast();
  const [defaultDeckId, setDefaultDeckId] = useState<string | null>(null);

  // Convert items to decks
  const decks = useMemo(() => items.map(itemToDeck), [items]);

  // Set default deck on load
  useEffect(() => {
    if (decks.length > 0) {
      const defaultDeck = decks.find(d => d.isDefault);
      if (defaultDeck) {
        setDefaultDeckId(defaultDeck.id);
      } else {
        setDefaultDeckId(decks[0].id);
      }
    }
  }, [decks]);

  // Create deck
  const createDeck = useCallback(async (deck: Omit<Deck, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newItem = await createItem({
        name: deck.name,
        contextType: 'deck',
        metadata: deckToItemMetadata(deck),
        orderIndex: deck.order ?? decks.length,
      });

      return newItem.id;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le deck",
        variant: "destructive"
      });
      return null;
    }
  }, [createItem, decks.length, toast]);

  // Update deck
  const updateDeck = useCallback(async (deckId: string, updates: Partial<Deck>) => {
    try {
      const item = items.find(i => i.id === deckId);
      if (!item) return false;

      await updateItem(deckId, {
        name: updates.name ?? item.name,
        orderIndex: updates.order ?? item.orderIndex,
        metadata: { ...item.metadata, ...deckToItemMetadata(updates) },
      });

      return true;
    } catch (error: any) {
      return false;
    }
  }, [items, updateItem]);

  // Delete deck (and its habits)
  const deleteDeck = useCallback(async (deckId: string) => {
    try {
      // Delete all habits in this deck first (they have parent_id = deckId)
      const habitsInDeck = items.filter(i => 
        i.contextType === 'habit' && i.parentId === deckId
      );
      
      for (const habit of habitsInDeck) {
        await deleteItem(habit.id);
      }
      
      // Then delete the deck
      await deleteItem(deckId);

      toast({
        title: "Deck supprimé",
        description: "Le deck et ses habitudes ont été supprimés avec succès"
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le deck",
        variant: "destructive"
      });
      return false;
    }
  }, [items, deleteItem, toast]);

  // Set default deck
  const setDefaultDeck = useCallback(async (deckId: string) => {
    try {
      // Unset current default
      for (const deck of decks) {
        if (deck.isDefault && deck.id !== deckId) {
          const item = items.find(i => i.id === deck.id);
          if (item) {
            await updateItem(deck.id, {
              metadata: { ...item.metadata, isDefault: false }
            });
          }
        }
      }

      // Set new default
      const item = items.find(i => i.id === deckId);
      if (item) {
        await updateItem(deckId, {
          metadata: { ...item.metadata, isDefault: true }
        });
      }

      setDefaultDeckId(deckId);
      return true;
    } catch (error: any) {
      return false;
    }
  }, [decks, items, updateItem]);

  return {
    decks,
    loading,
    defaultDeckId,
    createDeck,
    updateDeck,
    deleteDeck,
    setDefaultDeck,
    reloadDecks: reload
  };
};
