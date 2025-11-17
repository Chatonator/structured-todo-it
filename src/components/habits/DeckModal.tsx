import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Deck } from '@/types/habit';

interface DeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deck: Omit<Deck, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  deck?: Deck | null;
}

const DECK_ICONS = ['🎯', '💪', '🌱', '🧘', '📚', '🏃', '🎨', '🧠', '✨', '🌟'];

const DeckModal: React.FC<DeckModalProps> = ({ isOpen, onClose, onSave, deck }) => {
  const [name, setName] = useState(deck?.name || '');
  const [description, setDescription] = useState(deck?.description || '');
  const [icon, setIcon] = useState(deck?.icon || '🎯');
  const [isDefault, setIsDefault] = useState(deck?.isDefault || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      name,
      description: description || undefined,
      color: '#ec4899',
      icon,
      isDefault,
      order: deck?.order || 0
    });

    setName('');
    setDescription('');
    setIcon('🎯');
    setIsDefault(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{deck ? 'Modifier le deck' : 'Nouveau deck'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="deck-name">Nom du deck</Label>
            <Input
              id="deck-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Santé & Bien-être"
              required
            />
          </div>

          <div>
            <Label htmlFor="deck-description">Description (optionnel)</Label>
            <Input
              id="deck-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Habitudes pour rester en forme"
            />
          </div>

          <div>
            <Label>Icône</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DECK_ICONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`text-2xl p-2 rounded border ${
                    icon === emoji ? 'border-habit bg-habit-light' : 'border-border'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-default"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-border"
            />
            <Label htmlFor="is-default" className="cursor-pointer">
              Définir comme deck par défaut
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="bg-habit hover:bg-habit-dark">
              {deck ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeckModal;
