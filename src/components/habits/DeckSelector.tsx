import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ChevronDown, Settings } from 'lucide-react';
import { Deck } from '@/types/habit';

interface DeckSelectorProps {
  decks: Deck[];
  selectedDeckId: string | null;
  onSelectDeck: (deckId: string) => void;
  onManageDecks: () => void;
}

const DeckSelector: React.FC<DeckSelectorProps> = ({
  decks,
  selectedDeckId,
  onSelectDeck,
  onManageDecks
}) => {
  const selectedDeck = decks.find(d => d.id === selectedDeckId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between border-habit">
          <span className="flex items-center gap-2">
            {selectedDeck?.icon && <span className="text-xl">{selectedDeck.icon}</span>}
            <span className="font-semibold">{selectedDeck?.name || 'Sélectionner un deck'}</span>
          </span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {decks.map(deck => (
          <DropdownMenuItem
            key={deck.id}
            onClick={() => onSelectDeck(deck.id)}
            className={selectedDeckId === deck.id ? 'bg-habit-light' : ''}
          >
            <span className="flex items-center gap-2">
              {deck.icon && <span className="text-xl">{deck.icon}</span>}
              <span>{deck.name}</span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onManageDecks}>
          <Settings className="w-4 h-4 mr-2" />
          Gérer les decks
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DeckSelector;
