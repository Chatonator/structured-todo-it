import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Star } from 'lucide-react';
import { Deck } from '@/types/habit';
import DeckModal from './DeckModal';

interface DeckManagementProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  onCreateDeck: (deck: Omit<Deck, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  onUpdateDeck: (deckId: string, updates: Partial<Deck>) => Promise<boolean>;
  onDeleteDeck: (deckId: string) => Promise<boolean>;
}

const DeckManagement: React.FC<DeckManagementProps> = ({
  isOpen,
  onClose,
  decks,
  onCreateDeck,
  onUpdateDeck,
  onDeleteDeck
}) => {
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  const handleSaveDeck = async (deckData: Omit<Deck, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (editingDeck) {
      await onUpdateDeck(editingDeck.id, deckData);
    } else {
      await onCreateDeck(deckData);
    }
    setIsDeckModalOpen(false);
    setEditingDeck(null);
  };

  const handleEditDeck = (deck: Deck) => {
    setEditingDeck(deck);
    setIsDeckModalOpen(true);
  };

  const handleDeleteDeck = async (deck: Deck) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le deck "${deck.name}" et toutes ses habitudes ?`)) {
      await onDeleteDeck(deck.id);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gérer mes decks</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {decks.map(deck => (
              <div
                key={deck.id}
                className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-all"
              >
                <span className="text-2xl">{deck.icon}</span>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{deck.name}</h3>
                    {deck.isDefault && (
                      <Star className="w-4 h-4 text-habit fill-habit" />
                    )}
                  </div>
                  {deck.description && (
                    <p className="text-sm text-muted-foreground">{deck.description}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditDeck(deck)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDeck(deck)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button
              onClick={() => {
                setEditingDeck(null);
                setIsDeckModalOpen(true);
              }}
              className="bg-habit hover:bg-habit-dark"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau deck
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeckModal
        isOpen={isDeckModalOpen}
        onClose={() => {
          setIsDeckModalOpen(false);
          setEditingDeck(null);
        }}
        onSave={handleSaveDeck}
        deck={editingDeck}
      />
    </>
  );
};

export default DeckManagement;
