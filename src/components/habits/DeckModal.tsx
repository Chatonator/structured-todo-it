import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmojiGrid } from '@/components/common/EmojiGrid';
import { Deck } from '@/types/habit';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deck: Omit<Deck, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  deck?: Deck | null;
}

const DECK_ICONS = ['🎯', '💪', '🌱', '🧘', '📚', '🏃', '🎨', '🧠', '✨', '🌟'];

const DeckModal: React.FC<DeckModalProps> = ({ isOpen, onClose, onSave, deck }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [isDefault, setIsDefault] = useState(false);

  React.useEffect(() => {
    if (deck) {
      setName(deck.name);
      setDescription(deck.description || '');
      setIcon(deck.icon || '🎯');
      setIsDefault(deck.isDefault || false);
    } else {
      setName('');
      setDescription('');
      setIcon('🎯');
      setIsDefault(false);
    }
  }, [deck, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      name,
      category: 'Quotidien',
      context: 'Perso',
      estimatedTime: 30,
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

  const isValid = name.trim().length > 0;

  return (
    <Sheet open={isOpen} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0 overflow-hidden">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="text-base font-semibold">
            {deck ? 'Modifier le deck' : 'Nouveau deck'}
          </SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* ─── Name (borderless-bottom) ─── */}
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du deck *"
              autoFocus
              required
              className={cn(
                'text-base h-11 font-medium placeholder:text-muted-foreground/60 border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-colors',
                !name.trim() && 'border-destructive'
              )}
            />

            {/* ─── Description ─── */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Habitudes pour rester en forme"
              />
            </div>

            {/* ─── Icon grid ─── */}
            <EmojiGrid value={icon} onChange={setIcon} options={DECK_ICONS} />

            {/* ─── Default checkbox ─── */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-default"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-border"
              />
              <Label htmlFor="is-default" className="cursor-pointer text-sm">
                Définir comme deck par défaut
              </Label>
            </div>
          </div>

          {/* ─── Sticky footer ─── */}
          <div className="border-t border-border p-4 bg-background">
            <Button type="submit" disabled={!isValid} className="w-full">
              <Check className="w-4 h-4 mr-2" />
              {deck ? 'Mettre à jour' : 'Créer le deck'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default DeckModal;
